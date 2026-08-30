import type { Metadata } from "next";
import { ViewTransition } from "react";
import { GrillzHeroSection } from "@/components/grillz-hero-section";
import { ProductCollectionSection } from "@/components/product-collection-section";
import { GrillzCastSection } from "@/components/grillz-cast-section";
import { getPublishedProductsByCategorySlug } from "@/lib/products";
import { PAGE_TRANSITION } from "@/lib/motion";

export const metadata: Metadata = {
  title: "Custom Grillz",
  description:
    "Custom-fit gold and diamond grillz from pluggeo&co — the streetwear-luxury staple, made to order.",
  alternates: { canonical: "/grillz" },
  openGraph: { url: "/grillz" },
};

// `force-dynamic`: see the Home page's comment on the same line — a plain
// Drizzle query gives Next no signal to ever re-render after the initial
// build otherwise.
export const dynamic = "force-dynamic";

export default async function GrillzPage() {
  const { products } = await getPublishedProductsByCategorySlug("grillz");

  return (
    <ViewTransition {...PAGE_TRANSITION}>
      <div className="flex flex-1 flex-col">
        <GrillzHeroSection />
        <ProductCollectionSection
          title="Best Grillz Collection"
          viewAllHref="/shop"
          products={products.slice(0, 4)}
        />
        <GrillzCastSection />
      </div>
    </ViewTransition>
  );
}
