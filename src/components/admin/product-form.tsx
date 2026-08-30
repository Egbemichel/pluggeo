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

type VariantAttributeRow = { key: string; value: string };
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

function emptyBulkValues(): string[] {
  return [""];
}

function emptyVariant(): VariantRow {
  return { label: "", priceOverride: "", available: true, attributes: [{ key: "Size", value: "" }] };
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
  // "Quickly add variants" tool (2026-08-30, per the admin: entering a
  // variant's attribute value only ever accepted one string, so a product
  // that comes in several sizes had no way to record that short of typing
  // all of them into one field ("16 inch, 18 Inch" — a real row found this
  // way while investigating) — a single variant genuinely can only have one
  // value per attribute key (it's one specific combination a shopper picks),
  // but *this product* can clearly have several same-attribute variants at
  // once. Rather than change what a variant means, this generates one
  // variant per value the admin lists here and drops them straight into the
  // list below — each is a normal, independently editable variant row
  // afterward, same as one added by hand.
  const [bulkCategory, setBulkCategory] = useState("");
  const [bulkValues, setBulkValues] = useState<string[]>(emptyBulkValues);
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
          ? { ...v, attributes: [...v.attributes, { key: unusedCategoryFor(v.attributes, -1), value: "" }] }
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
  const updateAttribute = (variantIndex: number, attrIndex: number, patch: Partial<VariantAttributeRow>) =>
    setVariants((prev) =>
      prev.map((v, i) =>
        i === variantIndex
          ? {
              ...v,
              attributes: v.attributes.map((a, ai) => (ai === attrIndex ? { ...a, ...patch } : a)),
            }
          : v
      )
    );

  const addBulkValueField = () => setBulkValues((prev) => [...prev, ""]);
  const removeBulkValueField = (index: number) =>
    setBulkValues((prev) => prev.filter((_, i) => i !== index));
  const updateBulkValue = (index: number, value: string) =>
    setBulkValues((prev) => prev.map((v, i) => (i === index ? value : v)));

  const bulkValueCount = bulkValues.filter((v) => v.trim().length > 0).length;

  const generateVariantsFromAttribute = () => {
    if (!bulkCategory) return;
    const values = bulkValues.map((v) => v.trim()).filter(Boolean);
    if (values.length === 0) return;

    const newRows: VariantRow[] = values.map((value) => ({
      label: value,
      priceOverride: "",
      available: true,
      attributes: [{ key: bulkCategory, value }],
    }));
    setVariants((prev) => [...prev, ...newRows]);
    setBulkCategory("");
    setBulkValues(emptyBulkValues());
  };

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
            v.attributes.filter((a) => a.key.trim().length > 0).map((a) => [a.key, a.value])
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

        <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border p-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">Quickly add variants for one attribute</p>
            <p className="text-xs text-muted-foreground">
              Pick a category and list every value it comes in — Size: 16 Inch, 17 Inch, 18
              Inch, 19 Inch — and each value becomes its own variant below automatically, so
              shoppers can pick between them on the product page.
            </p>
          </div>
          <div className="flex flex-wrap items-start gap-2">
            <Select value={bulkCategory || undefined} onValueChange={(value) => setBulkCategory(value as string)}>
              <SelectTrigger className="w-40 shrink-0">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {VARIANT_ATTRIBUTE_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex flex-1 flex-wrap gap-2">
              {bulkValues.map((value, index) => (
                <div key={index} className="flex items-center gap-1">
                  <Input
                    value={value}
                    onChange={(e) => updateBulkValue(index, e.target.value)}
                    placeholder="e.g. 16 Inch"
                    className="w-32"
                  />
                  {bulkValues.length > 1 && (
                    <button
                      type="button"
                      aria-label="Remove value"
                      onClick={() => removeBulkValueField(index)}
                      className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <Icon icon={Delete02Icon} size={14} />
                    </button>
                  )}
                  {index === bulkValues.length - 1 && (
                    <button
                      type="button"
                      aria-label="Add another value"
                      onClick={addBulkValueField}
                      className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <Icon icon={Add01Icon} size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={generateVariantsFromAttribute}
            disabled={!bulkCategory || bulkValueCount === 0}
            className="self-start rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add {bulkValueCount > 0 ? bulkValueCount : ""} variant{bulkValueCount === 1 ? "" : "s"}
          </button>
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            Or add one manually — for a variant that mixes several attributes, or a one-off.
          </p>
          <button
            type="button"
            onClick={addVariant}
            className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <Icon icon={Add01Icon} size={16} />
            Add variant
          </button>
        </div>

        {variants.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No variants — this product has a single fixed price/attributes.
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
                Pick a category (Size, Width, Gold Color, ...) and its value for this
                variant — the PDP groups every variant&apos;s values by category automatically.
              </p>
              {variant.attributes.map((attr, attrIndex) => {
                const options = VARIANT_ATTRIBUTE_CATEGORIES.filter(
                  (c) => c === attr.key || !variant.attributes.some((a, i) => i !== attrIndex && a.key === c)
                );
                return (
                  <div key={attrIndex} className="flex items-center gap-2">
                    <Select
                      value={attr.key || undefined}
                      onValueChange={(value) => updateAttribute(index, attrIndex, { key: value as string })}
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
                    <Input
                      value={attr.value}
                      onChange={(e) => updateAttribute(index, attrIndex, { value: e.target.value })}
                      placeholder="e.g. 6.5 Inch"
                    />
                    <button
                      type="button"
                      aria-label="Remove attribute"
                      onClick={() => removeAttribute(index, attrIndex)}
                      className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <Icon icon={Delete02Icon} size={14} />
                    </button>
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
