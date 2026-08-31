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

// What a shopper can pick from for one attribute — e.g. `{ key: "Size",
// values: ["16 Inch", "17 Inch", "18 Inch"] }`. See db/schema.ts's own
// comment on `productOptions` for the full rework this belongs to.
// `valuePriceDeltas` is optional and keyed by one of `values` — see
// db/schema.ts's own comment on that column for why this exists alongside
// (not instead of) combination-based `variants` pricing below.
export const productOptionSchema = z.object({
  key: z.string().min(1),
  values: z.array(z.string().min(1)).min(1),
  valuePriceDeltas: z.record(z.string(), z.number()).optional(),
});

// One *complete* combination that costs or stocks differently from the
// base product — no `label` (removed 2026-08-31; never shown to a shopper
// anywhere, see db/schema.ts's own comment) and `attributes` is one value
// per key, a genuinely complete combination, not a group of values sharing
// one row.
export const variantSchema = z.object({
  attributes: z.record(z.string(), z.string().min(1)),
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
  options: z.array(productOptionSchema),
  variants: z.array(variantSchema),
});

export type ProductInput = z.infer<typeof productInputSchema>;
