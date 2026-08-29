"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCategory, updateCategory, type CategoryInput } from "@/app/admin/categories/actions";

export type CategoryFormInitialValues = {
  id?: string;
  name: string;
  slug: string;
  displayOrder: string;
};

export const EMPTY_CATEGORY_FORM_VALUES: CategoryFormInitialValues = {
  name: "",
  slug: "",
  displayOrder: "0",
};

export type CategoryFormProps = {
  initialValues: CategoryFormInitialValues;
};

export function CategoryForm({ initialValues }: CategoryFormProps) {
  const isEditing = Boolean(initialValues.id);
  const [name, setName] = useState(initialValues.name);
  const [slug, setSlug] = useState(initialValues.slug);
  const [displayOrder, setDisplayOrder] = useState(initialValues.displayOrder);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const input: CategoryInput = {
      name,
      slug,
      displayOrder: Number(displayOrder),
    };

    startTransition(async () => {
      try {
        if (isEditing && initialValues.id) {
          await updateCategory(initialValues.id, input);
        } else {
          await createCategory(input);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong saving this category.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-6">
      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="slug">Slug</Label>
        <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="displayOrder">Display order</Label>
        <Input
          id="displayOrder"
          type="number"
          step="1"
          value={displayOrder}
          onChange={(e) => setDisplayOrder(e.target.value)}
          required
        />
      </div>

      <div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? "Saving..." : isEditing ? "Save changes" : "Create category"}
        </button>
      </div>
    </form>
  );
}
