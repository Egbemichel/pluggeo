import { cache } from "react";
import { asc, desc, eq, and, ne, inArray } from "drizzle-orm";
import { db } from "@/db";
import { products, productMedia, productVariants, categories } from "@/db/schema";

// Storefront-facing product queries — replaces the hardcoded placeholder
// arrays that every catalog page (shop/category/home/grillz/related/search)
// used to render. Kept in one place since every page needs the same shape
// (see `StorefrontProductCard`, which matches `ProductCardProps` minus
// `layout`) and the same "only published products" rule.
//
// `isFromPrice` is always `false` on `StorefrontProductCard` (list/grid
// views) — computing a real variant price range would mean loading every
// listed product's variants just to render a grid (against the
// drizzle-schema skill's "no per-row queries in a loop" rule). The PDP
// (`StorefrontProductDetail`) DOES load real variants now — see
// `getProductDetailBySlug` — since that's a single-product query and
// ProductCustomize needs them to render real chip groups.

const PLACEHOLDER_IMAGE = { src: "/placeholder-product.svg", alt: "Placeholder product" };

export type StorefrontProductCard = {
  key: string;
  href: string;
  image: { src: string; alt: string };
  images: { src: string; alt: string }[];
  imageCount: number;
  category: string;
  /** Category slug, for filtering (e.g. Shop's sidebar) — `category` above
   * is the display name. `null` for products with no category assigned. */
  categorySlug: string | null;
  title: string;
  price: number;
  compareAtPrice?: number;
  isFromPrice: boolean;
};

export type StorefrontProductDetail = {
  id: string;
  slug: string;
  title: string;
  category: string;
  categoryId: string | null;
  price: number;
  compareAtPrice?: number;
  description: string | null;
  images: { src: string; alt: string }[];
  variants: {
    label: string;
    attributes: Record<string, string>;
    available: boolean;
    priceOverride: number | null;
  }[];
};

type ProductRow = typeof products.$inferSelect;
type MediaRow = typeof productMedia.$inferSelect;

function imagesForProduct(media: MediaRow[], title: string): { src: string; alt: string }[] {
  const images = media
    .filter((m) => m.type === "image")
    .map((m) => ({ src: m.url, alt: m.altText || title }));
  return images.length > 0 ? images : [PLACEHOLDER_IMAGE];
}

function toCard(
  product: ProductRow,
  categoryName: string | null,
  categorySlug: string | null,
  media: MediaRow[]
): StorefrontProductCard {
  const images = imagesForProduct(media, product.name);
  return {
    key: product.id,
    href: `/product/${product.slug}`,
    image: images[0],
    images,
    imageCount: images.length,
    category: categoryName ?? "pluggeo&co",
    categorySlug,
    title: product.name,
    price: Number(product.price),
    compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : undefined,
    isFromPrice: false,
  };
}

async function mediaByProductId(productIds: string[]): Promise<Map<string, MediaRow[]>> {
  if (productIds.length === 0) return new Map();
  const rows = await db
    .select()
    .from(productMedia)
    .where(inArray(productMedia.productId, productIds))
    .orderBy(asc(productMedia.sortOrder));

  const map = new Map<string, MediaRow[]>();
  for (const row of rows) {
    const existing = map.get(row.productId);
    if (existing) existing.push(row);
    else map.set(row.productId, [row]);
  }
  return map;
}

async function toCards(
  rows: { product: ProductRow; categoryName: string | null; categorySlug: string | null }[]
): Promise<StorefrontProductCard[]> {
  const media = await mediaByProductId(rows.map((r) => r.product.id));
  return rows.map(({ product, categoryName, categorySlug }) =>
    toCard(product, categoryName, categorySlug, media.get(product.id) ?? [])
  );
}

export async function getPublishedProducts(): Promise<StorefrontProductCard[]> {
  const rows = await db
    .select({ product: products, categoryName: categories.name, categorySlug: categories.slug })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.status, "published"))
    .orderBy(desc(products.createdAt));

  return toCards(rows);
}

// Wrapped in React's `cache()` — both the page component and its
// `generateMetadata` (needs the same category/products for the SEO
// description and canonical) call this per request; without dedup that's
// two identical DB round-trips per page view.
export const getPublishedProductsByCategorySlug = cache(async function getPublishedProductsByCategorySlug(
  categorySlug: string
): Promise<{ category: { id: string; name: string } | null; products: StorefrontProductCard[] }> {
  const [category] = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(eq(categories.slug, categorySlug));

  if (!category) return { category: null, products: [] };

  const rows = await db
    .select({ product: products, categoryName: categories.name, categorySlug: categories.slug })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.status, "published"), eq(products.categoryId, category.id)))
    .orderBy(desc(products.createdAt));

  return { category, products: await toCards(rows) };
});

/** Homepage's "Bestsellers" — curated via the admin's Homepage screen
 * (`featured`/`featuredOrder` on `products`), not a real sales-derived
 * bestseller ranking (no order data exists to derive one from — see the
 * out-of-scope checkout/orders rule in CLAUDE.md). */
export async function getFeaturedProducts(limit = 4): Promise<StorefrontProductCard[]> {
  const rows = await db
    .select({ product: products, categoryName: categories.name, categorySlug: categories.slug })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.status, "published"), eq(products.featured, true)))
    .orderBy(asc(products.featuredOrder), desc(products.createdAt))
    .limit(limit);

  return toCards(rows);
}

// Wrapped in React's `cache()` — same reasoning as
// `getPublishedProductsByCategorySlug` above: the PDP's `generateMetadata`
// (title/description/OG image/Product JSON-LD) and the page component both
// need the same product per request.
export const getProductDetailBySlug = cache(async function getProductDetailBySlug(
  slug: string
): Promise<StorefrontProductDetail | null> {
  const [row] = await db
    .select({ product: products, categoryName: categories.name, categorySlug: categories.slug })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.slug, slug), eq(products.status, "published")));

  if (!row) return null;

  const [media, variants] = await Promise.all([
    db
      .select()
      .from(productMedia)
      .where(eq(productMedia.productId, row.product.id))
      .orderBy(asc(productMedia.sortOrder)),
    db.select().from(productVariants).where(eq(productVariants.productId, row.product.id)),
  ]);

  return {
    id: row.product.id,
    slug: row.product.slug,
    title: row.product.name,
    category: row.categoryName ?? "pluggeo&co",
    categoryId: row.product.categoryId,
    price: Number(row.product.price),
    compareAtPrice: row.product.compareAtPrice ? Number(row.product.compareAtPrice) : undefined,
    variants: variants.map((v) => ({
      label: v.label,
      attributes: v.attributes,
      available: v.available,
      priceOverride: v.priceOverride != null ? Number(v.priceOverride) : null,
    })),
    description: row.product.description,
    images: imagesForProduct(media, row.product.name),
  };
});

export async function getRelatedProducts(
  categoryId: string | null,
  excludeProductId: string,
  limit = 4
): Promise<StorefrontProductCard[]> {
  if (!categoryId) return [];

  const rows = await db
    .select({ product: products, categoryName: categories.name, categorySlug: categories.slug })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(
      and(
        eq(products.status, "published"),
        eq(products.categoryId, categoryId),
        ne(products.id, excludeProductId)
      )
    )
    .orderBy(desc(products.createdAt))
    .limit(limit);

  return toCards(rows);
}

export type StorefrontCategory = { id: string; name: string; slug: string };

export async function getStorefrontCategories(): Promise<StorefrontCategory[]> {
  return db
    .select({ id: categories.id, name: categories.name, slug: categories.slug })
    .from(categories)
    .orderBy(asc(categories.displayOrder));
}

// Client-side substring search over the full published catalog — no search
// index/backend exists (small boutique catalog, not a scale where that's
// needed yet). Returns the same card shape SearchOverlay already renders
// via ProductLineItemCard's optional size/width/goldColor/goldType fields
// left unset (real products don't have those specific structured keys —
// see ProductLineItemCard's own comment).
export async function getSearchableProducts(): Promise<StorefrontProductCard[]> {
  return getPublishedProducts();
}
