import type { Metadata } from "next";
import { ViewTransition } from "react";
import { notFound } from "next/navigation";
import { CategoryPageContent } from "@/components/category-page-content";
import { getPublishedProductsByCategorySlug, getFeaturedProducts } from "@/lib/products";
import { minDelay } from "@/lib/min-delay";
import { PAGE_TRANSITION } from "@/lib/motion";
import { SITE_NAME, SITE_URL, pageMetadata } from "@/lib/seo";

// Server Component so `params`/the real category query can be awaited;
// CategoryPageContent (a Client Component) just owns pagination state.
// Tagline copy is still placeholder per category — no CMS/admin field for
// it yet (docs/ADMIN.md's category list doesn't include a tagline).
const TAGLINES: Record<string, string> = {
  bracelets: "Classy and premium",
  chains: "Bold and iconic",
  pendants: "Small details, big statement",
  watches: "Timeless on your wrist",
  sets: "Matched, not mixed",
  grillz: "Custom-fit luxury",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { category } = await getPublishedProductsByCategorySlug(slug);
  if (!category) return {};

  const title = category.name;
  const description = `Shop ${category.name} at ${SITE_NAME} — ${TAGLINES[slug] ?? "handcrafted, streetwear-luxury jewelry"}.`;

  return pageMetadata({ title, description, path: `/category/${slug}` });
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [{ slug }] = await Promise.all([params, minDelay(400)]);

  const { category, products } = await getPublishedProductsByCategorySlug(slug);
  if (!category) notFound();

  // "More from us" — featured products (same curation the homepage uses),
  // excluding whatever's already shown above, so the two sections don't
  // just repeat the same products when a category has few items.
  const shownIds = new Set(products.map((p) => p.key));
  const moreProducts = (await getFeaturedProducts(8)).filter((p) => !shownIds.has(p.key));

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Shop", item: `${SITE_URL}/shop` },
      { "@type": "ListItem", position: 3, name: category.name, item: `${SITE_URL}/category/${slug}` },
    ],
  };

  return (
    <ViewTransition {...PAGE_TRANSITION}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <CategoryPageContent
        category={category.name}
        tagline={TAGLINES[slug] ?? "Handcrafted for you"}
        products={products}
        moreProducts={moreProducts}
      />
    </ViewTransition>
  );
}
