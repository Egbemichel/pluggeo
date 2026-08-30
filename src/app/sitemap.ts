import type { MetadataRoute } from "next";
import { getPublishedProducts, getStorefrontCategories } from "@/lib/products";
import { SITE_URL } from "@/lib/seo";

// Same staleness trap as every other DB-backed route in this app (see the
// Home page's own comment): without `force-dynamic`, Next has no signal
// that a plain Drizzle query should ever go stale, so it would freeze this
// sitemap's product/category list at build time instead of reflecting
// what's actually published.
export const dynamic = "force-dynamic";

// Dynamic, DB-driven — every published product/category is a real,
// crawlable page, so the sitemap should never fall out of sync with what's
// actually live (a static list would). `/bag` (no unique indexable content,
// placeholder cart) and `/pluggeo`/`/sign-in` (see robots.ts) are
// deliberately excluded.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([
    getPublishedProducts(),
    getStorefrontCategories(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/grillz`, changeFrequency: "weekly", priority: 0.8 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${SITE_URL}/category/${category.slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${SITE_URL}${product.href}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
