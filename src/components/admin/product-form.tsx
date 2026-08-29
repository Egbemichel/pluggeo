"use client";

import { useState, useTransition } from "react";
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
import { createProduct, updateProduct, type ProductInput } from "@/app/admin/products/actions";

// Plain HTML form + Server Actions, not react-hook-form — the shadcn `form`
// primitive assumes react-hook-form, which isn't part of this project's
// stack, and docs/API.md/CLAUDE.md already lock Server Actions as the
// default data-mutation path. Replace-in-place for media/variants (the
// Server Action deletes and re-inserts both on every save) matches this
// form's own "send the whole current state" shape, not incremental diffing.

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

function emptyVariant(): VariantRow {
  return { label: "", priceOverride: "", available: true, attributes: [{ key: "", value: "" }] };
}

export function ProductForm({ categories, initialValues }: ProductFormProps) {
  const isEditing = Boolean(initialValues.id);
  const [name, setName] = useState(initialValues.name);
  const [slug, setSlug] = useState(initialValues.slug);
  const [description, setDescription] = useState(initialValues.description);
  const [price, setPrice] = useState(initialValues.price);
  const [compareAtPrice, setCompareAtPrice] = useState(initialValues.compareAtPrice);
  const [categoryId, setCategoryId] = useState(initialValues.categoryId);
  const [status, setStatus] = useState<"draft" | "published">(initialValues.status);
  const [featured, setFeatured] = useState(initialValues.featured);
  const [media, setMedia] = useState<MediaItem[]>(initialValues.media);
  const [variants, setVariants] = useState<VariantRow[]>(initialValues.variants);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const addVariant = () => setVariants((prev) => [...prev, emptyVariant()]);
  const removeVariant = (index: number) =>
    setVariants((prev) => prev.filter((_, i) => i !== index));
  const updateVariant = (index: number, patch: Partial<VariantRow>) =>
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  const addAttribute = (variantIndex: number) =>
    setVariants((prev) =>
      prev.map((v, i) =>
        i === variantIndex ? { ...v, attributes: [...v.attributes, { key: "", value: "" }] } : v
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const input: ProductInput = {
      name,
      slug,
      description: description || undefined,
      price: Number(price),
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
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
          priceOverride: v.priceOverride ? Number(v.priceOverride) : undefined,
          available: v.available,
        })),
    };

    startTransition(async () => {
      try {
        if (isEditing && initialValues.id) {
          await updateProduct(initialValues.id, input);
        } else {
          await createProduct(input);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong saving this product.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex max-w-3xl flex-col gap-8">
      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-base">Details</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} required />
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="compareAtPrice">Compare-at price</Label>
            <Input
              id="compareAtPrice"
              type="number"
              min="0"
              step="0.01"
              value={compareAtPrice}
              onChange={(e) => setCompareAtPrice(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Category</Label>
            <Select value={categoryId || undefined} onValueChange={(value) => setCategoryId(value as string)}>
              <SelectTrigger className="w-full">
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
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as "draft" | "published")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-2 pt-6 text-sm">
            <Checkbox checked={featured} onCheckedChange={(checked) => setFeatured(checked === true)} />
            Featured
          </label>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-base">Media</h2>
        <MediaUpload items={media} onChange={setMedia} />
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-base">Variants</h2>
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
            No variants — this product has a single fixed price/attributes.
          </p>
        )}

        {variants.map((variant, index) => (
          <div key={index} className="flex flex-col gap-3 rounded-lg border border-border p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Label</Label>
                  <Input
                    value={variant.label}
                    onChange={(e) => updateVariant(index, { label: e.target.value })}
                    placeholder="e.g. Small / 10k"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Price override</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={variant.priceOverride}
                    onChange={(e) => updateVariant(index, { priceOverride: e.target.value })}
                  />
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
              {variant.attributes.map((attr, attrIndex) => (
                <div key={attrIndex} className="flex items-center gap-2">
                  <Input
                    value={attr.key}
                    onChange={(e) => updateAttribute(index, attrIndex, { key: e.target.value })}
                    placeholder="e.g. material"
                    className="max-w-40"
                  />
                  <Input
                    value={attr.value}
                    onChange={(e) => updateAttribute(index, attrIndex, { value: e.target.value })}
                    placeholder="e.g. 10k gold"
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
              ))}
              <button
                type="button"
                onClick={() => addAttribute(index)}
                className="self-start text-xs text-muted-foreground hover:text-foreground"
              >
                + Add attribute
              </button>
            </div>
          </div>
        ))}
      </section>

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
