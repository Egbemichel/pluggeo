// Known variant-attribute categories for jewelry (Size/Width/Length/Gold
// Color/etc.) — shared between the admin's variant editor (a Select instead
// of a freeform text key, so every product uses the same category names)
// and the PDP's Customize dropdown (which groups a product's real variants
// by these same keys). A fixed list rather than fully freeform text
// guarantees the PDP can group cleanly — "Gold Color" on one product and
// "Gold color" on another would otherwise render as two different chip
// groups instead of one. `db/schema.ts`'s `attributes` column itself stays
// a flexible JSONB Record<string,string> — this list is an application-
// layer convention on top of it, not a schema constraint (per the
// drizzle-schema skill: "flexible shouldn't mean untyped chaos in the
// application layer").
export const VARIANT_ATTRIBUTE_CATEGORIES = [
  "Size",
  "Width",
  "Length",
  "Gold Color",
  "Gold Type",
  "Material",
  "Chain Length",
  "Stone",
] as const;

export type VariantAttributeCategory = (typeof VARIANT_ATTRIBUTE_CATEGORIES)[number];
