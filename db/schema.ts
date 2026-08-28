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

export const productImages = pgTable("product_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  altText: text("alt_text"),
  sortOrder: integer("sort_order").notNull().default(0),
});

// Jewelry attributes differ by category (material/karat, size, chain length, etc.) —
// keep this flexible rather than modeling rigid columns per category. See docs/DATABASE.md.
export const productVariants = pgTable("product_variants", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  attributes: jsonb("attributes").$type<Record<string, string>>().notNull().default({}),
  priceOverride: numeric("price_override", { precision: 10, scale: 2 }),
  available: boolean("available").notNull().default(true),
});
