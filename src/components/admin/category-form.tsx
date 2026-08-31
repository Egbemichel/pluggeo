"use client";

import { useState, useTransition } from "react";
import { unstable_rethrow } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminToast, describeActionError } from "@/components/admin/toast";
import { createCategory, updateCategory } from "@/app/pluggeo/categories/actions";
import { categoryInputSchema } from "@/app/pluggeo/categories/schema";
import { slugify } from "@/lib/slugify";

// Same UI/UX pass as product-form.tsx (2026-08-29) — see that file's own
// comment for the reasoning behind each piece (auto-slug, shared
// client/server zod validation, required marks, fieldset/legend, success
// message on edit).

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

export function CategoryForm({ initialValues }: CategoryFormProps) {
  const isEditing = Boolean(initialValues.id);
  const [name, setName] = useState(initialValues.name);
  const [slug, setSlug] = useState(initialValues.slug);
  const [slugTouched, setSlugTouched] = useState(isEditing);
  const [displayOrder, setDisplayOrder] = useState(initialValues.displayOrder);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Validation-only — the actual save outcome reports through a toast
  // instead (see product-form.tsx's identical comment). Both create *and*
  // update redirect back to the category list here (unlike products, where
  // only create redirects), so a `setSuccessMessage` placed after either
  // `await` call could never actually run — the redirect throws first, a
  // real pre-existing dead-code bug this replaces along with the fix.
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  };
  const handleSlugChange = (value: string) => {
    setSlug(value);
    setSlugTouched(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsed = categoryInputSchema.safeParse({ name, slug, displayOrder });
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const nextErrors: Record<string, string> = {};
      for (const [field, messages] of Object.entries(fieldErrors)) {
        if (messages?.[0]) nextErrors[field] = messages[0];
      }
      setErrors(nextErrors);
      const firstField = Object.keys(nextErrors)[0];
      document.getElementById(firstField)?.focus();
      return;
    }

    setErrors({});

    startTransition(async () => {
      try {
        if (isEditing && initialValues.id) {
          await updateCategory(initialValues.id, parsed.data);
        } else {
          await createCategory(parsed.data);
        }
        // Both branches redirect on success (see actions.ts) — neither
        // ever actually reaches this line; the target list page fires its
        // own toast on landing via `?created=1`/`?updated=1`.
      } catch (err) {
        unstable_rethrow(err);
        const message = describeActionError(err, "Something went wrong saving this category.");
        setFormError(message);
        adminToast.error(message);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex max-w-md flex-col gap-6">
      {formError && (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {formError}
        </div>
      )}
      <fieldset className="flex flex-col gap-6">
        <legend className="sr-only">Category details</legend>
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
              Used in the category URL (/category/{slug || "..."}) — auto-filled from the
              name, editable.
            </p>
          )}
          <FieldError id="slug-error" message={errors.slug} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="displayOrder">
            Display order
            <RequiredMark />
          </Label>
          <Input
            id="displayOrder"
            type="number"
            step="1"
            value={displayOrder}
            onChange={(e) => setDisplayOrder(e.target.value)}
            aria-invalid={Boolean(errors.displayOrder)}
            aria-describedby={errors.displayOrder ? "displayOrder-error" : "displayOrder-hint"}
          />
          {!errors.displayOrder && (
            <p id="displayOrder-hint" className="text-xs text-muted-foreground">
              Lower numbers show first (e.g. in the shop&apos;s category picker).
            </p>
          )}
          <FieldError id="displayOrder-error" message={errors.displayOrder} />
        </div>
      </fieldset>

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
