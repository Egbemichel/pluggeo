import {
  pgTable,
  text,
  uuid,
  integer,
  numeric,
  boolean,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  categoryId: uuid("category_id").references(() => categories.id),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  // Original pre-sale price, shown struck through next to `price` when set — confirmed
  // by the real Product Card design (node 557:3742: "Sale" label + strikethrough price).
  compareAtPrice: numeric("compare_at_price", { precision: 10, scale: 2 }),
  status: text("status", { enum: ["draft", "published"] })
    .notNull()
    .default("draft"),
  featured: boolean("featured").notNull().default(false),
  featuredOrder: integer("featured_order"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Renamed from `product_images` (2026-08-29) — the admin now uploads video
// alongside photos (see docs/ADMIN.md), so a table named "images" holding
// videos too was misleading. `type` distinguishes how each item renders
// storefront-side (e.g. ProductSpotlight's coverflow already branches on
// media type for CelebrityShowcase; product galleries get the same
// treatment once real data replaces the placeholder arrays).
export const productMedia = pgTable("product_media", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["image", "video"] })
    .notNull()
    .default("image"),
  url: text("url").notNull(),
  altText: text("alt_text"),
  sortOrder: integer("sort_order").notNull().default(0),
});

// Jewelry attributes differ by category (material/karat, size, chain length, etc.) —
// keep this flexible rather than modeling rigid columns per category. See docs/DATABASE.md.
//
// Full rework (2026-08-31, per the admin, working through several rounds of
// "how should this actually behave"): attributes and their possible values
// are now defined once per product here — "what a shopper can pick from" —
// completely separate from pricing. `product_variants` (below) went from
// "one row per admin-chosen group of values" to a sparse table of
// *complete* combinations that cost or stock differently from the base
// product; a combination with no row here simply uses the product's own
// price and is available by default. This removes the ambiguity the old
// model had (two separate single-attribute rows both matching a selection
// at once, with no real way to say which price should win) — every
// possible combination is generated from *this* table, and each one either
// has an explicit override or doesn't; there's never a competing pair.
export const productOptions = pgTable("product_options", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  values: jsonb("values").$type<string[]>().notNull().default([]),
  sortOrder: integer("sort_order").notNull().default(0),
});

// One row per *complete* combination that needs a different price and/or
// stock status than the base product — see `productOptions`'s comment. No
// `label` column (dropped 2026-08-30 then 2026-08-31 for real — it was
// never shown to a shopper anywhere and only ever caused confusion; the
// admin never needs to name a row, since `attributes` already fully
// describes it). `attributes` is one value per key (a genuinely complete
// combination), not an array — the array shape briefly used here let one
// row group several values under one price, which is exactly the source of
// the "which price wins" ambiguity this rework removes.
export const productVariants = pgTable("product_variants", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  attributes: jsonb("attributes").$type<Record<string, string>>().notNull().default({}),
  priceOverride: numeric("price_override", { precision: 10, scale: 2 }),
  available: boolean("available").notNull().default(true),
});
