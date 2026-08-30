"use client";

import { useRef, useState, useTransition } from "react";
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
import { createProduct, updateProduct } from "@/app/pluggeo/products/actions";
import { productInputSchema } from "@/app/pluggeo/products/schema";
import { VARIANT_ATTRIBUTE_CATEGORIES } from "@/lib/product-attributes";
import { slugify } from "@/lib/slugify";
import { cn } from "@/lib/utils";

// Plain HTML form + Server Actions, not react-hook-form — the shadcn `form`
// primitive assumes react-hook-form, which isn't part of this project's
// stack, and docs/API.md/CLAUDE.md already lock Server Actions as the
// default data-mutation path. Replace-in-place for media/variants (the
// Server Action deletes and re-inserts both on every save) matches this
// form's own "send the whole current state" shape, not incremental diffing.
//
// UI/UX pass (2026-08-29), per the user asking for real form best
// practices, not just a working form: auto-generated slug from the name
// (stops once the admin edits slug directly — `slugTouched`), inline
// per-field validation errors (using the SAME zod schema the server
// validates with — `productInputSchema`, extracted to schema.ts since a
// "use server" file may only export async functions — so client/server
// validation can never silently drift apart), required-field asterisks,
// `$`-prefixed price inputs, `<fieldset>`/`<legend>` for each section
// (proper semantic grouping, not just a styled heading), autofocus on the
// first field, and a transient success message after an *edit* save
// (create already redirects to the edit page, which is its own confirmation
// that the save landed — a toast there would be redundant). Media/variants
// validation errors surface as one summary line rather than granular
// per-row messages — those are array-shaped errors zod's `flatten()`
// doesn't map cleanly to a single field, and the two real failure modes
// (an empty required variant label, a malformed price) are already obvious
// from the row itself once you look at it.

export type ProductCategory = { id: string; name: string };

// `values` (plural) — one attribute row holds every value this variant
// comes in (Size: 16/17/18/19 Inch), sharing this one row's own price
// override/availability, not just a single value (2026-08-30, per the
// admin). See db/schema.ts's own comment on `productVariants.attributes`.
type VariantAttributeRow = { key: string; values: string[] };
type VariantRow = {
  label: string;
  priceOverride: string;
  available: boolean;
  attributes: VariantAttributeRow[];
};

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
  variants: VariantRow[];
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
  variants: [],
};

export type ProductFormProps = {
  categories: ProductCategory[];
  initialValues: ProductFormInitialValues;
};

function unusedCategoryFor(attributes: VariantAttributeRow[], currentIndex: number): string {
  const used = new Set(attributes.filter((_, i) => i !== currentIndex).map((a) => a.key));
  return VARIANT_ATTRIBUTE_CATEGORIES.find((c) => !used.has(c)) ?? "";
}

function emptyVariant(): VariantRow {
  return { label: "", priceOverride: "", available: true, attributes: [{ key: "Size", values: [""] }] };
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
  const [variants, setVariants] = useState<VariantRow[]>(initialValues.variants);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  };
  const handleSlugChange = (value: string) => {
    setSlug(value);
    setSlugTouched(true);
  };

  const addVariant = () => setVariants((prev) => [...prev, emptyVariant()]);
  const removeVariant = (index: number) =>
    setVariants((prev) => prev.filter((_, i) => i !== index));
  const updateVariant = (index: number, patch: Partial<VariantRow>) =>
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  const addAttribute = (variantIndex: number) =>
    setVariants((prev) =>
      prev.map((v, i) =>
        i === variantIndex
          ? { ...v, attributes: [...v.attributes, { key: unusedCategoryFor(v.attributes, -1), values: [""] }] }
          : v
      )
    );
  const removeAttribute = (variantIndex: number, attrIndex: number) =>
    setVariants((prev) =>
      prev.map((v, i) =>
        i === variantIndex
          ? { ...v, attributes: v.attributes.filter((_, ai) => ai !== attrIndex) }
          : v
      )
    );
  const updateAttributeKey = (variantIndex: number, attrIndex: number, key: string) =>
    setVariants((prev) =>
      prev.map((v, i) =>
        i === variantIndex
          ? { ...v, attributes: v.attributes.map((a, ai) => (ai === attrIndex ? { ...a, key } : a)) }
          : v
      )
    );
  // Adds another value input right after the last one for this attribute
  // (2026-08-30, per the admin: clicking "+" beside Size's value field
  // should add a second, third, fourth input for more sizes — not open a
  // separate section) — this is the actual fix for the original complaint.
  const addAttributeValue = (variantIndex: number, attrIndex: number) =>
    setVariants((prev) =>
      prev.map((v, i) =>
        i === variantIndex
          ? {
              ...v,
              attributes: v.attributes.map((a, ai) =>
                ai === attrIndex ? { ...a, values: [...a.values, ""] } : a
              ),
            }
          : v
      )
    );
  const removeAttributeValue = (variantIndex: number, attrIndex: number, valueIndex: number) =>
    setVariants((prev) =>
      prev.map((v, i) =>
        i === variantIndex
          ? {
              ...v,
              attributes: v.attributes.map((a, ai) =>
                ai === attrIndex ? { ...a, values: a.values.filter((_, vi) => vi !== valueIndex) } : a
              ),
            }
          : v
      )
    );
  const updateAttributeValue = (
    variantIndex: number,
    attrIndex: number,
    valueIndex: number,
    value: string
  ) =>
    setVariants((prev) =>
      prev.map((v, i) =>
        i === variantIndex
          ? {
              ...v,
              attributes: v.attributes.map((a, ai) =>
                ai === attrIndex
                  ? { ...a, values: a.values.map((val, vi) => (vi === valueIndex ? value : val)) }
                  : a
              ),
            }
          : v
      )
    );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

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
      variants: variants
        .filter((v) => v.label.trim().length > 0)
        .map((v) => ({
          label: v.label,
          attributes: Object.fromEntries(
            v.attributes
              .filter((a) => a.key.trim().length > 0)
              .map((a) => [a.key, a.values.map((val) => val.trim()).filter(Boolean)])
              .filter(([, values]) => (values as string[]).length > 0)
          ),
          priceOverride: v.priceOverride || undefined,
          available: v.available,
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
      if (nextErrors.media || nextErrors.variants) {
        setFormError("Check the media/variants sections below — one of them isn't valid.");
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
          setSuccessMessage("Product saved.");
          if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
          successTimeoutRef.current = setTimeout(() => setSuccessMessage(null), 3000);
        } else {
          await createProduct(parsed.data);
        }
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "Something went wrong saving this product.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex max-w-3xl flex-col gap-8">
      {formError && (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {formError}
        </div>
      )}
      {successMessage && (
        <div
          role="status"
          className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary"
        >
          {successMessage}
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
            <Select value={categoryId || undefined} onValueChange={(value) => setCategoryId(value as string)}>
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

      <fieldset className="flex flex-col gap-3 rounded-md border border-border bg-card px-4 py-5 sm:px-6">
        <legend className="px-2 font-heading text-base font-semibold">Variants</legend>

        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={addVariant}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <Icon icon={Add01Icon} size={16} />
            Add variant
          </button>
        </div>

        {variants.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No variants — this product has a single fixed price/attributes. Add a variant
            for things like size, width, or gold color/type; each value becomes a chip on
            the product page&apos;s Customize section.
          </p>
        )}

        {variants.map((variant, index) => (
          <div key={index} className="flex flex-col gap-3 rounded-lg border border-border p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`variant-${index}-label`}>
                    Label
                    <RequiredMark />
                  </Label>
                  <Input
                    id={`variant-${index}-label`}
                    value={variant.label}
                    onChange={(e) => updateVariant(index, { label: e.target.value })}
                    placeholder="e.g. Small / 10k"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`variant-${index}-price`}>Price override</Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <Input
                      id={`variant-${index}-price`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={variant.priceOverride}
                      onChange={(e) => updateVariant(index, { priceOverride: e.target.value })}
                      className="pl-5.5"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 pt-6 text-sm">
                  <Checkbox
                    checked={variant.available}
                    onCheckedChange={(checked) => updateVariant(index, { available: checked === true })}
                  />
                  Available
                </label>
              </div>
              <button
                type="button"
                aria-label="Remove variant"
                onClick={() => removeVariant(index)}
                className="mt-6 flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Icon icon={Delete02Icon} size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Attributes</Label>
              <p className="text-xs text-muted-foreground">
                Pick a category (Size, Width, Gold Color, ...), then list every value it
                comes in — the + beside a value adds another one. Every value becomes its
                own chip on the product page, sharing this variant&apos;s price/availability.
              </p>
              {variant.attributes.map((attr, attrIndex) => {
                const options = VARIANT_ATTRIBUTE_CATEGORIES.filter(
                  (c) => c === attr.key || !variant.attributes.some((a, i) => i !== attrIndex && a.key === c)
                );
                return (
                  <div key={attrIndex} className="flex flex-col gap-2 rounded-md border border-border p-3">
                    <div className="flex items-center gap-2">
                      <Select
                        value={attr.key || undefined}
                        onValueChange={(value) => updateAttributeKey(index, attrIndex, value as string)}
                      >
                        <SelectTrigger className="w-40 shrink-0">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          {options.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <button
                        type="button"
                        aria-label="Remove attribute"
                        onClick={() => removeAttribute(index, attrIndex)}
                        className="ml-auto flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <Icon icon={Delete02Icon} size={14} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {attr.values.map((value, valueIndex) => (
                        <div key={valueIndex} className="flex items-center gap-1">
                          <Input
                            value={value}
                            onChange={(e) => updateAttributeValue(index, attrIndex, valueIndex, e.target.value)}
                            placeholder="e.g. 16 Inch"
                            className="w-32"
                          />
                          {attr.values.length > 1 && (
                            <button
                              type="button"
                              aria-label="Remove value"
                              onClick={() => removeAttributeValue(index, attrIndex, valueIndex)}
                              className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                              <Icon icon={Delete02Icon} size={14} />
                            </button>
                          )}
                          {valueIndex === attr.values.length - 1 && (
                            <button
                              type="button"
                              aria-label="Add another value"
                              onClick={() => addAttributeValue(index, attrIndex)}
                              className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                              <Icon icon={Add01Icon} size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              <button
                type="button"
                disabled={unusedCategoryFor(variant.attributes, -1) === ""}
                onClick={() => addAttribute(index)}
                className={cn(
                  "self-start text-xs text-muted-foreground hover:text-foreground",
                  unusedCategoryFor(variant.attributes, -1) === "" && "cursor-not-allowed opacity-50"
                )}
              >
                + Add attribute
              </button>
            </div>
          </div>
        ))}
      </fieldset>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? "Saving..." : isEditing ? "Save changes" : "Create product"}
        </button>
      </div>
    </form>
  );
}
