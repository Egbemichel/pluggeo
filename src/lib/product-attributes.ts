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

// A real example value per category — shown as each value input's
// placeholder in the admin's variant editor (2026-08-30, per the admin: the
// placeholder read "16 Inch" for every category, Gold Type included, which
// made no sense once picked). Every category has a genuinely different unit
// (inches, millimeters, karats, a material name...), so one hardcoded
// placeholder was always wrong for every category but one.
export const VARIANT_ATTRIBUTE_VALUE_PLACEHOLDER: Record<VariantAttributeCategory, string> = {
  Size: "16 Inch",
  Width: "6.5 mm",
  Length: "20 Inch",
  "Gold Color": "Rose Gold",
  "Gold Type": "18k",
  Material: "Sterling Silver",
  "Chain Length": "22 Inch",
  Stone: "Diamond",
};

// Grillz's own attribute set (2026-08-31, per the owner: a Grillz product's
// Customize dropdown needs completely different fields from every other
// category, per a real competitor reference — johnnydangandco.com). A
// separate list, not additions to the jewelry one above, since a Grillz
// product's admin should see exactly these five options, not a combined
// 13-entry dropdown mixing "Stone" and "Mold Kit". Which list the admin's
// product form offers is decided by the product's selected category (see
// `product-form.tsx`'s `isGrillzCategory`), keyed off the category's slug
// (`"grillz"`), not its display name, so a future rename doesn't silently
// break the switch.
export const GRILLZ_ATTRIBUTE_CATEGORIES = [
  "Gold Color",
  "Design Type",
  "Top Teeth Count",
  "Bottom Teeth Count",
  "Mold Kit",
  "Perm Cuts",
  "Deep Cuts",
] as const;

export type GrillzAttributeCategory = (typeof GRILLZ_ATTRIBUTE_CATEGORIES)[number];

export const GRILLZ_ATTRIBUTE_VALUE_PLACEHOLDER: Record<GrillzAttributeCategory, string> = {
  "Gold Color": "Rose Gold",
  "Design Type": "Diamond Cut",
  "Top Teeth Count": "8",
  "Bottom Teeth Count": "8",
  "Mold Kit": "Yes",
  "Perm Cuts": "Yes",
  "Deep Cuts": "Yes",
};
