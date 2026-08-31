"use client";

import { useMemo, useState, useTransition } from "react";
import { unstable_rethrow } from "next/navigation";
import { Add01Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MediaUpload, type MediaItem } from "@/components/admin/media-upload";
import { adminToast, describeActionError } from "@/components/admin/toast";
import { createProduct, updateProduct } from "@/app/pluggeo/products/actions";
import { productInputSchema } from "@/app/pluggeo/products/schema";
import {
  VARIANT_ATTRIBUTE_CATEGORIES,
  VARIANT_ATTRIBUTE_VALUE_PLACEHOLDER,
  GRILLZ_ATTRIBUTE_CATEGORIES,
  GRILLZ_ATTRIBUTE_VALUE_PLACEHOLDER,
} from "@/lib/product-attributes";
import { slugify } from "@/lib/slugify";
import { useFormDraft, clearFormDraft } from "@/lib/use-form-draft";
import { cn } from "@/lib/utils";

// Plain HTML form + Server Actions, not react-hook-form — the shadcn `form`
// primitive assumes react-hook-form, which isn't part of this project's
// stack, and docs/API.md/CLAUDE.md already lock Server Actions as the
// default data-mutation path. Replace-in-place for media/options/variants
// (the Server Action deletes and re-inserts all three on every save)
// matches this form's own "send the whole current state" shape, not
// incremental diffing.
//
// UI/UX pass (2026-08-29), per the user asking for real form best
// practices, not just a working form: auto-generated slug from the name
// (stops once the admin edits slug directly — `slugTouched`), inline
// per-field validation errors (using the SAME zod schema the server
// validates with — `productInputSchema`, extracted to schema.ts since a
// "use server" file may only export async functions — so client/server
// validation can never silently drift apart), required-field asterisks,
// `$`-prefixed price inputs, `<fieldset>`/`<legend>` for each section
// (proper semantic grouping, not just a styled heading), and autofocus on
// the first field. Both create and update report success via a toast (see
// the 2026-08-31 admin-feedback pass below) rather than a static banner.
//
// Options & pricing, full rework (2026-08-31, several rounds of "how should
// this actually behave" with the admin) — replaces the old "Variants"
// section entirely (per the admin: remove anything that doesn't fit the
// new direction). The admin now defines *options* — what a shopper can
// choose from, e.g. Size: 16/17/18 Inch — completely separately from
// pricing. Every possible combination across all options is generated
// automatically and listed below with its own optional price/availability;
// leaving a combination blank means "same as the base price." This is what
// actually removes the old ambiguity: there's no more manually deciding
// which values to group into one row, and no more two separate rows both
// matching one selection with no way to say which price should win —
// every combination gets exactly one place to set its price, or none at
// all if it doesn't need one.
//
// Grillz gets a second, additive pricing mode instead of the combination
// table above (2026-08-31, per the owner, matching a real competitor
// reference — johnnydangandco.com): "how many top teeth" alone is 13
// possible values, times 13 for bottom teeth, times up to 8 more for Mold
// Kit/Perm Cuts/Deep Cuts — the combination table's Cartesian product would
// be 1,000+ rows for a Grillz product, which stops being a usable admin
// screen (and doesn't match reality either — a real grillz shop prices each
// tooth count on its own, not per exact combination). `isGrillzCategory`
// (matched by the selected category's *slug*, not its display name, so a
// future rename can't silently break this) swaps both which attribute
// categories the dropdown offers and how pricing is entered: a small $
// add-on per value instead of a combination table. See db/schema.ts's
// `productOptions.valuePriceDeltas` and `ProductCustomize`'s own comment
// for the storefront half.

export type ProductCategory = { id: string; name: string; slug: string };

type OptionRow = { key: string; values: string[]; priceDeltas: string[] };
type CombinationOverride = { priceOverride: string; available: boolean };

export type ProductFormInitialValues = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  compareAtPrice: string;
  categoryId: string;
  status: "draft" | "published";
  featured: boolean;
  media: MediaItem[];
  options: { key: string; values: string[]; valuePriceDeltas?: Record<string, number> }[];
  /** Sparse — only combinations that cost or stock differently from the
   * base product. */
  variants: { attributes: Record<string, string>; priceOverride: string; available: boolean }[];
};

export const EMPTY_PRODUCT_FORM_VALUES: ProductFormInitialValues = {
  name: "",
  slug: "",
  description: "",
  price: "",
  compareAtPrice: "",
  categoryId: "",
  status: "draft",
  featured: false,
  media: [],
  options: [],
  variants: [],
};

export type ProductFormProps = {
  categories: ProductCategory[];
  initialValues: ProductFormInitialValues;
};

// The server stores per-value price add-ons keyed by the value's own label
// (`Record<string, number>`); the form edits them as a plain-string array
// running parallel to `values` by index instead, so renaming a value's text
// mid-edit doesn't lose track of its price (a label-keyed structure would).
function toOptionRows(options: ProductFormInitialValues["options"]): OptionRow[] {
  return options.map((o) => ({
    key: o.key,
    values: o.values,
    priceDeltas: o.values.map((v) => {
      const delta = o.valuePriceDeltas?.[v];
      return delta ? String(delta) : "";
    }),
  }));
}

function unusedCategoryFor(
  rows: { key: string }[],
  currentIndex: number,
  attributeCategories: readonly string[]
): string {
  const used = new Set(rows.filter((_, i) => i !== currentIndex).map((r) => r.key));
  return attributeCategories.find((c) => !used.has(c)) ?? "";
}

// Canonical signature for one complete combination — sorted so the same
// combination always produces the same key regardless of option order,
// used both to look up an existing override and to key the submitted
// `attributes` object the same way `ProductCustomize` does on the
// storefront (see that file's own `comboKey`).
function comboKeyFor(attributes: Record<string, string>): string {
  return Object.entries(attributes)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${value}`)
    .join("|");
}

// Every possible combination across all options with real values — the
// Cartesian product. A product with only one option (just Size) degenerates
// to one combination per value, exactly the simple case; two options fan
// out to every pairing.
function combinationsFor(options: OptionRow[]): Record<string, string>[] {
  const active = options
    .filter((o) => o.key.trim().length > 0)
    .map((o) => ({ key: o.key, values: o.values.map((v) => v.trim()).filter(Boolean) }))
    .filter((o) => o.values.length > 0);

  if (active.length === 0) return [];

  return active.reduce<Record<string, string>[]>(
    (combos, option) => {
      const next: Record<string, string>[] = [];
      for (const combo of combos) {
        for (const value of option.values) next.push({ ...combo, [option.key]: value });
      }
      return next;
    },
    [{}]
  );
}

function RequiredMark() {
  return (
    <span className="text-destructive" aria-hidden="true">
      {" "}
      *
    </span>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-xs text-destructive">
      {message}
    </p>
  );
}

export function ProductForm({ categories, initialValues }: ProductFormProps) {
  const isEditing = Boolean(initialValues.id);
  const [name, setName] = useState(initialValues.name);
  const [slug, setSlug] = useState(initialValues.slug);
  const [slugTouched, setSlugTouched] = useState(isEditing);
  const [description, setDescription] = useState(initialValues.description);
  const [price, setPrice] = useState(initialValues.price);
  const [compareAtPrice, setCompareAtPrice] = useState(initialValues.compareAtPrice);
  const [categoryId, setCategoryId] = useState(initialValues.categoryId);
  const [status, setStatus] = useState<"draft" | "published">(initialValues.status);
  const [featured, setFeatured] = useState(initialValues.featured);
  const [media, setMedia] = useState<MediaItem[]>(initialValues.media);
  const [options, setOptions] = useState<OptionRow[]>(() => toOptionRows(initialValues.options));
  // Keyed by `comboKeyFor` so an override survives options being reordered
  // or a new value being added elsewhere — only the exact combination it
  // was set for ever looks it up again.
  const [combinationOverrides, setCombinationOverrides] = useState<Record<string, CombinationOverride>>(
    () => {
      const map: Record<string, CombinationOverride> = {};
      for (const v of initialValues.variants) {
        map[comboKeyFor(v.attributes)] = { priceOverride: v.priceOverride, available: v.available };
      }
      return map;
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Validation-only now (2026-08-31) — the actual save outcome (network/
  // server errors, and success) reports through a toast instead, per the
  // user: clicking "Save changes" gave no real feedback once it finished.
  // This banner stays purely for "you have unfixed field errors," which
  // needs to persist while the admin reads it, not flash and vanish.
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Draft persistence (2026-08-31) — see use-form-draft.ts's own comment for
  // why. Keyed by product id (or "new") so an abandoned draft never leaks
  // into a different product's edit page.
  const draftKey = `product-draft-${initialValues.id ?? "new"}`;
  const [draftRestored, setDraftRestored] = useState(false);
  const draftSnapshot = useMemo(
    () => ({
      name,
      slug,
      slugTouched,
      description,
      price,
      compareAtPrice,
      categoryId,
      status,
      featured,
      media,
      options,
      combinationOverrides,
    }),
    [name, slug, slugTouched, description, price, compareAtPrice, categoryId, status, featured, media, options, combinationOverrides]
  );
  useFormDraft(draftKey, draftSnapshot, (draft) => {
    setName(draft.name);
    setSlug(draft.slug);
    setSlugTouched(draft.slugTouched);
    setDescription(draft.description);
    setPrice(draft.price);
    setCompareAtPrice(draft.compareAtPrice);
    setCategoryId(draft.categoryId);
    setStatus(draft.status);
    setFeatured(draft.featured);
    setMedia(draft.media);
    setOptions(draft.options);
    setCombinationOverrides(draft.combinationOverrides);
    setDraftRestored(true);
  });
  const discardDraft = () => {
    clearFormDraft(draftKey);
    setName(initialValues.name);
    setSlug(initialValues.slug);
    setSlugTouched(isEditing);
    setDescription(initialValues.description);
    setPrice(initialValues.price);
    setCompareAtPrice(initialValues.compareAtPrice);
    setCategoryId(initialValues.categoryId);
    setStatus(initialValues.status);
    setFeatured(initialValues.featured);
    setMedia(initialValues.media);
    setOptions(toOptionRows(initialValues.options));
    setCombinationOverrides(() => {
      const map: Record<string, CombinationOverride> = {};
      for (const v of initialValues.variants) {
        map[comboKeyFor(v.attributes)] = { priceOverride: v.priceOverride, available: v.available };
      }
      return map;
    });
    setDraftRestored(false);
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  };
  const handleSlugChange = (value: string) => {
    setSlug(value);
    setSlugTouched(true);
  };

  // Matched by slug, not display name, so a future category rename can't
  // silently break which attribute set/pricing mode a product gets — see
  // the file's own top comment.
  const isGrillzCategory = categories.find((c) => c.id === categoryId)?.slug === "grillz";
  const attributeCategories = isGrillzCategory ? GRILLZ_ATTRIBUTE_CATEGORIES : VARIANT_ATTRIBUTE_CATEGORIES;
  const valuePlaceholders: Record<string, string> = isGrillzCategory
    ? GRILLZ_ATTRIBUTE_VALUE_PLACEHOLDER
    : VARIANT_ATTRIBUTE_VALUE_PLACEHOLDER;

  // Grillz and jewelry products use entirely different attribute
  // vocabularies (Top Teeth Count vs. Gold Type) and pricing modes
  // (additive per-value vs. per-combination) — switching a product's
  // category across that line mid-edit clears whatever options/combination
  // pricing were already entered, since carrying them over would mean
  // showing e.g. a leftover "Gold Type" chip (with its own $ add-on) on a
  // Grillz product's storefront page. Only actually clears when there's
  // something to clear and the mode genuinely flips — picking a different
  // jewelry category, or Grillz to Grillz, never touches this.
  const handleCategoryChange = (nextCategoryId: string) => {
    const nextIsGrillz = categories.find((c) => c.id === nextCategoryId)?.slug === "grillz";
    if (nextIsGrillz !== isGrillzCategory && options.length > 0) {
      setOptions([]);
      setCombinationOverrides({});
      adminToast.success("Options cleared — Grillz and jewelry products use different option types.");
    }
    setCategoryId(nextCategoryId);
  };

  const addOption = () =>
    setOptions((prev) => [
      ...prev,
      { key: unusedCategoryFor(prev, -1, attributeCategories), values: [""], priceDeltas: [""] },
    ]);
  const removeOption = (index: number) => setOptions((prev) => prev.filter((_, i) => i !== index));
  const updateOptionKey = (index: number, key: string) =>
    setOptions((prev) => prev.map((o, i) => (i === index ? { ...o, key } : o)));
  const addOptionValue = (index: number) =>
    setOptions((prev) =>
      prev.map((o, i) =>
        i === index ? { ...o, values: [...o.values, ""], priceDeltas: [...o.priceDeltas, ""] } : o
      )
    );
  const removeOptionValue = (index: number, valueIndex: number) =>
    setOptions((prev) =>
      prev.map((o, i) =>
        i === index
          ? {
              ...o,
              values: o.values.filter((_, vi) => vi !== valueIndex),
              priceDeltas: o.priceDeltas.filter((_, vi) => vi !== valueIndex),
            }
          : o
      )
    );
  const updateOptionValue = (index: number, valueIndex: number, value: string) =>
    setOptions((prev) =>
      prev.map((o, i) =>
        i === index ? { ...o, values: o.values.map((v, vi) => (vi === valueIndex ? value : v)) } : o
      )
    );
  const updateOptionPriceDelta = (index: number, valueIndex: number, delta: string) =>
    setOptions((prev) =>
      prev.map((o, i) =>
        i === index
          ? { ...o, priceDeltas: o.priceDeltas.map((d, vi) => (vi === valueIndex ? delta : d)) }
          : o
      )
    );

  // No combination table for Grillz — see the file's own top comment for
  // why (1,000+ rows for the Cartesian product of its 5 options).
  const combinations = useMemo(
    () => (isGrillzCategory ? [] : combinationsFor(options)),
    [isGrillzCategory, options]
  );

  const updateCombination = (key: string, patch: Partial<CombinationOverride>) =>
    setCombinationOverrides((prev) => {
      const current = prev[key] ?? { priceOverride: "", available: true };
      return { ...prev, [key]: { ...current, ...patch } };
    });

  const basePriceNumber = Number(price);
  const basePriceDisplay =
    price.trim() !== "" && Number.isFinite(basePriceNumber)
      ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(basePriceNumber)
      : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const rawInput = {
      name,
      slug,
      description: description || undefined,
      price,
      compareAtPrice: compareAtPrice || undefined,
      categoryId: categoryId || undefined,
      status,
      featured,
      media: media.map((m) => ({ type: m.type, url: m.url, altText: m.altText })),
      options: options
        .filter((o) => o.key.trim().length > 0 && o.values.some((v) => v.trim().length > 0))
        .map((o) => {
          const trimmedValues = o.values.map((v) => v.trim()).filter(Boolean);
          // Keyed by the value's own label for storage — see `toOptionRows`'s
          // comment for why the form itself edits these as a parallel array
          // instead. Blank/zero means "no add-on," same convention
          // `product_variants.priceOverride` already uses.
          const valuePriceDeltas: Record<string, number> = {};
          o.values.forEach((value, i) => {
            const trimmedValue = value.trim();
            const delta = Number(o.priceDeltas[i]);
            if (trimmedValue && o.priceDeltas[i]?.trim() && Number.isFinite(delta) && delta > 0) {
              valuePriceDeltas[trimmedValue] = delta;
            }
          });
          return { key: o.key, values: trimmedValues, valuePriceDeltas };
        }),
      // Sparse on purpose — only a combination the admin actually gave a
      // price to, or explicitly marked unavailable, becomes a real row.
      // Everything else already means "same as the base price, in stock"
      // without needing to say so.
      variants: combinations
        .map((attrs) => {
          const override = combinationOverrides[comboKeyFor(attrs)];
          return { attrs, override };
        })
        .filter(({ override }) => override && (override.priceOverride.trim() !== "" || !override.available))
        .map(({ attrs, override }) => ({
          attributes: attrs,
          priceOverride: override!.priceOverride || undefined,
          available: override!.available,
        })),
    };

    const parsed = productInputSchema.safeParse(rawInput);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const nextErrors: Record<string, string> = {};
      for (const [field, messages] of Object.entries(fieldErrors)) {
        if (messages?.[0]) nextErrors[field] = messages[0];
      }
      setErrors(nextErrors);
      if (nextErrors.media || nextErrors.options || nextErrors.variants) {
        setFormError("Check the media/options sections below — one of them isn't valid.");
      }
      // Move focus to the first invalid field so a screen reader / keyboard
      // user lands exactly where the problem is, not just sees a banner.
      const firstField = Object.keys(nextErrors)[0];
      document.getElementById(firstField)?.focus();
      return;
    }

    setErrors({});

    startTransition(async () => {
      try {
        if (isEditing && initialValues.id) {
          await updateProduct(initialValues.id, parsed.data);
          clearFormDraft(draftKey);
          adminToast.success("Product saved.");
        } else {
          // Redirects back to a blank "new product" form on success (see
          // actions.ts — 2026-08-31, per the admin: he's entering many
          // products in a row and wants a clean form each time, not to land
          // on the one he just filled in) — there's no client-side
          // "resolved" moment to toast from here, so that page fires its
          // own "Product created" toast once it lands (see its `?created=1`
          // handling). Cleared *before*
          // the call, not after — a line after `await createProduct` here
          // is dead code on success (the redirect throws before reaching
          // it), and there's no public API to tell a genuine failure apart
          // from that redirect inside the catch below. Client validation
          // already passed by this point, so the one thing this trades away
          // is the draft surviving a rare genuine server-side failure — the
          // in-memory form itself is untouched either way, so nothing is
          // lost unless the tab also closes in that exact moment.
          clearFormDraft(draftKey);
          await createProduct(parsed.data);
        }
      } catch (err) {
        // A successful `createProduct` call never actually resolves — it
        // redirects — which Next.js implements as a thrown control-flow
        // error. Must rethrow it here before treating anything as a real
        // failure, or every successful create would show as an error toast.
        unstable_rethrow(err);
        const message = describeActionError(err, "Something went wrong saving this product.");
        setFormError(message);
        adminToast.error(message);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex max-w-3xl flex-col gap-8">
      {draftRestored && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground"
        >
          <span>Restored your unsaved changes from before the refresh.</span>
          <button
            type="button"
            onClick={discardDraft}
            className="shrink-0 font-medium text-foreground underline-offset-2 hover:underline"
          >
            Discard, start over
          </button>
        </div>
      )}
      {formError && (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {formError}
        </div>
      )}

      <fieldset className="flex flex-col gap-4 rounded-md border border-border bg-card px-4 py-5 sm:px-6">
        <legend className="px-2 font-heading text-base font-semibold">Basic info</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">
              Name
              <RequiredMark />
            </Label>
            <Input
              id="name"
              autoFocus
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            <FieldError id="name-error" message={errors.name} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="slug">
              Slug
              <RequiredMark />
            </Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              aria-invalid={Boolean(errors.slug)}
              aria-describedby={errors.slug ? "slug-error" : "slug-hint"}
            />
            {!errors.slug && (
              <p id="slug-hint" className="text-xs text-muted-foreground">
                Used in the product URL — auto-filled from the name, editable.
              </p>
            )}
            <FieldError id="slug-error" message={errors.slug} />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4 rounded-md border border-border bg-card px-4 py-5 sm:px-6">
        <legend className="px-2 font-heading text-base font-semibold">Pricing</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="price">
              Price
              <RequiredMark />
            </Label>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="pl-5.5"
                aria-invalid={Boolean(errors.price)}
                aria-describedby={errors.price ? "price-error" : undefined}
              />
            </div>
            <FieldError id="price-error" message={errors.price} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="compareAtPrice">Compare-at price</Label>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="compareAtPrice"
                type="number"
                min="0"
                step="0.01"
                value={compareAtPrice}
                onChange={(e) => setCompareAtPrice(e.target.value)}
                className="pl-5.5"
                aria-invalid={Boolean(errors.compareAtPrice)}
                aria-describedby={errors.compareAtPrice ? "compareAtPrice-error" : "compareAtPrice-hint"}
              />
            </div>
            {!errors.compareAtPrice && (
              <p id="compareAtPrice-hint" className="text-xs text-muted-foreground">
                Optional — shown struck through when higher than price.
              </p>
            )}
            <FieldError id="compareAtPrice-error" message={errors.compareAtPrice} />
          </div>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4 rounded-md border border-border bg-card px-4 py-5 sm:px-6">
        <legend className="px-2 font-heading text-base font-semibold">Organization</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="categoryId">Category</Label>
            <Select value={categoryId || undefined} onValueChange={(value) => handleCategoryChange(value as string)}>
              <SelectTrigger id="categoryId" className="w-full">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as "draft" | "published")}>
              <SelectTrigger id="status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Only published products show on the storefront.</p>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={featured} onCheckedChange={(checked) => setFeatured(checked === true)} />
          Featured on homepage
        </label>
      </fieldset>

      <fieldset className="flex flex-col gap-3 rounded-md border border-border bg-card px-4 py-5 sm:px-6">
        <legend className="px-2 font-heading text-base font-semibold">Media</legend>
        <MediaUpload items={media} onChange={setMedia} />
      </fieldset>

      <fieldset className="flex flex-col gap-4 rounded-md border border-border bg-card px-4 py-5 sm:px-6">
        <legend className="px-2 font-heading text-base font-semibold">Options &amp; pricing</legend>

        {/* Heavy, plain-language explainer, per the user: anyone uploading a
            product should understand this immediately, not have to guess.
            Grillz gets its own version — the pricing model genuinely works
            differently, not just the option names (see the file's own top
            comment for why a combination table doesn't fit Grillz). */}
        {isGrillzCategory ? (
          <div className="flex flex-col gap-1.5 rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">1. Add an option</strong> — Top Teeth Count,
              Bottom Teeth Count, Mold Kit, Perm Cuts, or Deep Cuts — and list every value it
              comes in (e.g. Top Teeth Count: 6, 8, 10, 12).
            </p>
            <p>
              <strong className="text-foreground">2. Give a value its own price</strong> in the $
              box right next to it. Leave it blank for no extra charge.
            </p>
            <p>
              <strong className="text-foreground">3. Every selected value&apos;s price adds
              together</strong> on top of this product&apos;s own price
              {basePriceDisplay ? ` (${basePriceDisplay})` : ""} — e.g. picking an 8-tooth top
              and a 6-tooth bottom adds both prices at once. There&apos;s no combination table
              to fill in for Grillz.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">1. Add an option</strong> for anything a shopper
              picks — Size, Gold Type, Stone, etc. — and list every value it comes in.
            </p>
            <p>
              <strong className="text-foreground">2. If you add more than one option</strong>, every
              possible combination is generated below automatically — no need to build them by hand.
            </p>
            <p>
              <strong className="text-foreground">3. Leave a combination&apos;s price blank</strong>{" "}
              to use this product&apos;s own price{basePriceDisplay ? ` (${basePriceDisplay})` : ""} for
              it. Only type a price if that exact combination should cost something different.
              Uncheck &quot;Available&quot; for a combination you don&apos;t actually carry.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Label>Options</Label>
            <button
              type="button"
              onClick={addOption}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <Icon icon={Add01Icon} size={16} />
              Add option
            </button>
          </div>

          {options.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No options yet — this product has a single fixed price. Add one to offer choices
              like size or gold type.
            </p>
          )}

          {options.map((option, index) => (
            <div key={index} className="flex flex-col gap-2 rounded-lg border border-border p-4">
              <div className="flex items-center gap-2">
                <Select
                  value={option.key || undefined}
                  onValueChange={(value) => updateOptionKey(index, value as string)}
                >
                  <SelectTrigger className="w-40 shrink-0">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {attributeCategories
                      .filter((c) => c === option.key || !options.some((o, i) => i !== index && o.key === c))
                      .map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <button
                  type="button"
                  aria-label="Remove option"
                  onClick={() => removeOption(index)}
                  className="ml-auto flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Icon icon={Delete02Icon} size={16} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {option.values.map((value, valueIndex) => (
                  <div key={valueIndex} className="flex items-center gap-1">
                    <Input
                      value={value}
                      onChange={(e) => updateOptionValue(index, valueIndex, e.target.value)}
                      placeholder={`e.g. ${valuePlaceholders[option.key] ?? "value"}`}
                      className="w-32"
                    />
                    {isGrillzCategory && (
                      <div className="relative w-24 shrink-0">
                        <span className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-xs text-muted-foreground">
                          $
                        </span>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={option.priceDeltas[valueIndex] ?? ""}
                          onChange={(e) => updateOptionPriceDelta(index, valueIndex, e.target.value)}
                          placeholder="Add-on"
                          aria-label={`Price add-on for ${value || "this value"}`}
                          className="pl-4.5 text-sm"
                        />
                      </div>
                    )}
                    {option.values.length > 1 && (
                      <button
                        type="button"
                        aria-label="Remove value"
                        onClick={() => removeOptionValue(index, valueIndex)}
                        className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <Icon icon={Delete02Icon} size={14} />
                      </button>
                    )}
                    {valueIndex === option.values.length - 1 && (
                      <button
                        type="button"
                        aria-label="Add another value"
                        onClick={() => addOptionValue(index)}
                        className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <Icon icon={Add01Icon} size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {combinations.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <Label>
                Pricing for each combination ({combinations.length}
                {combinations.length === 1 ? " combination" : " combinations"})
              </Label>
              <p className="text-xs text-muted-foreground">
                Generated automatically from the options above — blank price = same as the base
                price{basePriceDisplay ? ` (${basePriceDisplay})` : ""}.
              </p>
            </div>

            {combinations.map((attrs) => {
              const key = comboKeyFor(attrs);
              const override = combinationOverrides[key] ?? { priceOverride: "", available: true };
              return (
                <div
                  key={key}
                  className="flex flex-col gap-3 rounded-md border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    {Object.entries(attrs).map(([attrKey, value]) => (
                      <span
                        key={attrKey}
                        className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium whitespace-nowrap"
                      >
                        <span className="text-muted-foreground">{attrKey}: </span>
                        {value}
                      </span>
                    ))}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <div className="relative w-32">
                      <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-xs text-muted-foreground">
                        $
                      </span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={override.priceOverride}
                        onChange={(e) => updateCombination(key, { priceOverride: e.target.value })}
                        placeholder="Same as base"
                        className="pl-5 text-sm"
                      />
                    </div>
                    <label className="flex items-center gap-1.5 text-xs whitespace-nowrap">
                      <Checkbox
                        checked={override.available}
                        onCheckedChange={(checked) =>
                          updateCombination(key, { available: checked === true })
                        }
                      />
                      Available
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </fieldset>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className={cn(
            "rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90",
            "disabled:opacity-50"
          )}
        >
          {isPending ? "Saving..." : isEditing ? "Save changes" : "Create product"}
        </button>
      </div>
    </form>
  );
}
