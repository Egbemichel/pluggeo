import { ViewTransition } from "react";
import { notFound } from "next/navigation";
import { CategoryPageContent } from "@/components/category-page-content";
import { getPublishedProductsByCategorySlug, getFeaturedProducts } from "@/lib/products";
import { minDelay } from "@/lib/min-delay";
import { PAGE_TRANSITION } from "@/lib/motion";

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

  return (
    <ViewTransition {...PAGE_TRANSITION}>
      <CategoryPageContent
        category={category.name}
        tagline={TAGLINES[slug] ?? "Handcrafted for you"}
        products={products}
        moreProducts={moreProducts}
      />
    </ViewTransition>
  );
}
