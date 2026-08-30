import type { Metadata } from "next";
import { ViewTransition } from "react";
import { ShopPageContent } from "@/components/shop-page-content";
import { getPublishedProducts, getStorefrontCategories } from "@/lib/products";
import { PAGE_TRANSITION } from "@/lib/motion";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Shop All Jewelry",
  description:
    "Browse the full pluggeo&co catalog — custom grillz, diamond watches, gold chains, bracelets, pendants, and jewelry sets.",
  path: "/shop",
});

// Server Component so real data can be fetched here and handed to
// ShopPageContent (a Client Component — filters/sort/pagination/layout are
// all local interactive state). See ShopPageContent's own comment for what
// is and isn't wired to real filtering yet.
//
// `force-dynamic`: a plain Drizzle query gives Next no signal to ever
// re-render this page after the initial build — see the Home page's
// comment on the same line for the full explanation and how this was
// actually confirmed (a real `next build` showing `○` static).
export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const [products, categories] = await Promise.all([
    getPublishedProducts(),
    getStorefrontCategories(),
  ]);

  return (
    <ViewTransition {...PAGE_TRANSITION}>
      <ShopPageContent
        products={products}
        categories={categories.map((c) => ({ id: c.slug, label: c.name }))}
      />
    </ViewTransition>
  );
}
