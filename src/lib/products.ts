import { cache } from "react";
import { asc, desc, eq, and, ne, inArray } from "drizzle-orm";
import { db } from "@/db";
import { products, productMedia, productVariants, productOptions, categories } from "@/db/schema";
import type { MediaItem } from "@/lib/media";

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

const PLACEHOLDER_IMAGE: MediaItem = {
  type: "image",
  src: "/placeholder-product.svg",
  alt: "Placeholder product",
};

export type StorefrontProductCard = {
  key: string;
  href: string;
  /** Always a real image, never a video — the safe "cover" thumbnail for
   * spots that can't play video (cart line items, the flying add-to-bag
   * icon, search results, nav). See `coverImageFor`. */
  image: { src: string; alt: string };
  /** The product's full media set, images and videos both, in admin-set
   * order — for the gallery surfaces that can render either (cards'
   * auto-cycle, Shop's spotlight, the PDP gallery, the lightbox). */
  images: MediaItem[];
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
  /** Always a real image, never a video — see `StorefrontProductCard.image`. */
  coverImage: { src: string; alt: string };
  images: MediaItem[];
  /** What a shopper can pick from — one entry per attribute the admin
   * defined, each with every value it comes in (e.g. `{ key: "Size",
   * values: ["16 Inch", "17 Inch"] }`). Independent of pricing; see
   * `variants` for what a specific complete combination actually costs.
   * `valuePriceDeltas` is a second, additive pricing path (Grillz's own
   * options use this instead of `variants` — see db/schema.ts's comment on
   * `productOptions.valuePriceDeltas` for why) — empty for any option that
   * doesn't use it. */
  options: { key: string; values: string[]; valuePriceDeltas: Record<string, number> }[];
  /** Sparse — only combinations that cost or stock differently from the
   * base product get a row here. A combination with no matching row here
   * uses this product's own `price` and is available by default; see
   * `db/schema.ts`'s comment on `productVariants` for why. */
  variants: {
    attributes: Record<string, string>;
    available: boolean;
    priceOverride: number | null;
  }[];
};

type ProductRow = typeof products.$inferSelect;
type MediaRow = typeof productMedia.$inferSelect;

// Cloudinary only serves a transformed (resized/reformatted) image when the
// delivery URL itself asks for one — and next/image's own optimizer turned
// out not to be doing that on this Cloudflare deployment (confirmed
// directly: a raw asset requested through `/_next/image?w=...` came back
// byte-identical to the untouched original, so it's a pure pass-through
// here, not a real optimizer — found while chasing a 16.6s mobile LCP).
// Inserting `f_auto,q_auto` asks Cloudinary itself to serve a modern format
// (WebP/AVIF where the visitor's browser supports it) at an auto-tuned
// quality — a real fix that doesn't depend on Next's broken pipeline at
// all. Idempotent (skips URLs that already carry a transformation segment)
// and a no-op on anything that isn't a genuine Cloudinary upload URL (e.g.
// the local placeholder SVG below). `width` is required, not defaulted —
// a real PageSpeed "improve image delivery" finding (490 KiB) caught a card
// thumbnail serving the *exact same* full-size delivery this function gave
// the PDP gallery/lightbox, so every caller now has to pick a width that
// actually matches where its image renders (see the two constants below).
function withCloudinaryAutoFormat(url: string, width: number): string {
  const marker = "/image/upload/";
  const index = url.indexOf(marker);
  if (index === -1) return url;
  const afterMarker = url.slice(index + marker.length);
  if (/^[a-z_]+_[^/]+\//.test(afterMarker)) return url;
  return url.slice(0, index + marker.length) + `f_auto,q_auto,w_${width}/` + afterMarker;
}

// Card/thumbnail contexts (Shop/Home grid cards, cart line items, the flying
// add-to-bag icon, search results, nav) never render past a few hundred CSS
// px — confirmed directly: the flagged image came back 199KB at the old
// unbounded `f_auto,q_auto` and 60KB at `w_600` (70% smaller, no visible
// softness at real card sizes even on a 2x display).
const CARD_IMAGE_WIDTH = 600;
// The PDP gallery/spotlight and its fullscreen lightbox are the one context
// that can legitimately fill most of a desktop viewport — capped well above
// the card width, not left unbounded.
const GALLERY_IMAGE_WIDTH = 1200;

// The video counterpart (2026-08-31, found via a real PageSpeed "browser
// errors" audit: a product video was failing to even load under Lighthouse's
// throttled mobile connection — `net::ERR_CONNECTION_FAILED` — because it
// was a raw, un-transformed upload at **17.2MB**, the single biggest
// resource on the entire page by a wide margin). Cloudinary's `f_auto,q_auto`
// works for video delivery exactly like it does for images. A follow-up
// PageSpeed run then caught a second product video (23s, 720x1280, 8.9MB
// source) failing with `net::ERR_TIMED_OUT` at `w_720,q_auto` — Cloudinary
// transcodes a never-before-requested derived video on the first real
// request, and at that size/quality the cold-start transcode was slow
// enough to blow Lighthouse's timeout. Dropped to `w_480,q_auto:eco`
// (confirmed: same video came back at 2.1MB in ~4.5s cold) — this catalog's
// videos are close-up jewelry shots meant to play in a card tile or the PDP
// gallery, never anywhere near source resolution, so the smaller cap costs
// no visible quality while cutting both payload and transcode time. Same
// idempotency/no-op guards as the image version above, just against
// `/video/upload/` instead.
function withCloudinaryVideoAutoFormat(url: string): string {
  const marker = "/video/upload/";
  const index = url.indexOf(marker);
  if (index === -1) return url;
  const afterMarker = url.slice(index + marker.length);
  if (/^[a-z_]+_[^/]+\//.test(afterMarker)) return url;
  return url.slice(0, index + marker.length) + "f_auto,q_auto:eco,w_480/" + afterMarker;
}

// Renamed from `imagesForProduct` (2026-08-30) — it was filtering every row
// down to `type === "image"` before this even ran, so an uploaded video
// never reached a single storefront surface (not the card, not Shop's
// spotlight, not the PDP) despite the admin genuinely accepting and storing
// it (`productMedia.type` has allowed "video" since 2026-08-29 — see that
// column's own comment). Videos now pass through in the same admin-set
// `sortOrder` as photos, each run through its own Cloudinary auto-format
// helper. `width` isn't defaulted for the same reason `withCloudinaryAutoFormat`
// isn't: `ProductCard` cycles through this *entire* array as a tile in a
// grid (Shop, Home) just as much as the PDP spotlight/lightbox cycles
// through it full-viewport — same function, two very different real sizes —
// so every caller passes the width that matches its own context.
function mediaForProduct(media: MediaRow[], title: string, width: number): MediaItem[] {
  const items = media.map((m) => ({
    type: m.type,
    src: m.type === "image" ? withCloudinaryAutoFormat(m.url, width) : withCloudinaryVideoAutoFormat(m.url),
    alt: m.altText || title,
  }));
  return items.length > 0 ? items : [PLACEHOLDER_IMAGE];
}

// The safe "cover" thumbnail — always a real image. Cart line items, the
// flying add-to-bag icon, search results, and nav all render this directly
// as a plain `<Image>`, so it must never resolve to a video URL; falls back
// to the first video-less item, then the shared placeholder. Takes the raw
// `MediaRow[]`, not `mediaForProduct`'s output, so it can apply its own
// `CARD_IMAGE_WIDTH` instead of inheriting the gallery's larger one.
function coverImageFor(media: MediaRow[], title: string): { src: string; alt: string } {
  const cover = media.find((m) => m.type === "image");
  if (!cover) return PLACEHOLDER_IMAGE;
  return { src: withCloudinaryAutoFormat(cover.url, CARD_IMAGE_WIDTH), alt: cover.altText || title };
}

function toCard(
  product: ProductRow,
  categoryName: string | null,
  categorySlug: string | null,
  media: MediaRow[]
): StorefrontProductCard {
  const images = mediaForProduct(media, product.name, CARD_IMAGE_WIDTH);
  return {
    key: product.id,
    href: `/product/${product.slug}`,
    image: coverImageFor(media, product.name),
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

  const [mediaRows, options, variants] = await Promise.all([
    db
      .select()
      .from(productMedia)
      .where(eq(productMedia.productId, row.product.id))
      .orderBy(asc(productMedia.sortOrder)),
    db
      .select()
      .from(productOptions)
      .where(eq(productOptions.productId, row.product.id))
      .orderBy(asc(productOptions.sortOrder)),
    db.select().from(productVariants).where(eq(productVariants.productId, row.product.id)),
  ]);

  const images = mediaForProduct(mediaRows, row.product.name, GALLERY_IMAGE_WIDTH);

  return {
    id: row.product.id,
    slug: row.product.slug,
    title: row.product.name,
    category: row.categoryName ?? "pluggeo&co",
    categoryId: row.product.categoryId,
    price: Number(row.product.price),
    compareAtPrice: row.product.compareAtPrice ? Number(row.product.compareAtPrice) : undefined,
    options: options.map((o) => ({ key: o.key, values: o.values, valuePriceDeltas: o.valuePriceDeltas })),
    variants: variants.map((v) => ({
      attributes: v.attributes,
      available: v.available,
      priceOverride: v.priceOverride != null ? Number(v.priceOverride) : null,
    })),
    description: row.product.description,
    coverImage: coverImageFor(mediaRows, row.product.name),
    images,
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
// via ProductLineItemCard, with no variant selected (search results add the
// base product, not a specific variant — see ProductLineItemCard's own
// comment).
export async function getSearchableProducts(): Promise<StorefrontProductCard[]> {
  return getPublishedProducts();
}
