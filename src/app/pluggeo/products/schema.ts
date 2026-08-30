import { z } from "zod";

// Shared between the Server Actions (src/app/pluggeo/products/actions.ts)
// and the client-side form (src/components/admin/product-form.tsx) — kept
// in its own plain module rather than actions.ts because a "use server"
// file may only export async functions, not a zod schema. Validating with
// the exact same schema client- and server-side means the inline errors
// the admin sees while filling the form can never drift from what the
// server will actually accept.

export const mediaItemSchema = z.object({
  type: z.enum(["image", "video"]),
  url: z.string().url(),
  altText: z.string().optional(),
});

export const variantSchema = z.object({
  label: z.string().min(1, "Variant label is required"),
  // Each attribute holds every value this variant comes in (e.g. Size:
  // ["16 Inch", "17 Inch", "18 Inch"]), not just one — see db/schema.ts's
  // own comment on `productVariants.attributes`.
  attributes: z.record(z.string(), z.array(z.string().min(1)).min(1)),
  priceOverride: z.coerce.number().positive("Must be a positive number").optional(),
  available: z.boolean(),
});

export const productInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Lowercase letters, numbers, and hyphens only"),
  description: z.string().optional(),
  price: z.coerce.number().positive("Price must be a positive number"),
  compareAtPrice: z.coerce.number().positive("Must be a positive number").optional(),
  categoryId: z.string().uuid().optional(),
  status: z.enum(["draft", "published"]),
  featured: z.boolean(),
  media: z.array(mediaItemSchema),
  variants: z.array(variantSchema),
});

export type ProductInput = z.infer<typeof productInputSchema>;
