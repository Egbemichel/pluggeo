import type { Metadata } from "next";
import { ViewTransition } from "react";
import { GrillzHeroSection } from "@/components/grillz-hero-section";
import { SectionHeader } from "@/components/section-header";
import { PaginatedProductGrid } from "@/components/paginated-product-grid";
import { GrillzCastSection } from "@/components/grillz-cast-section";
import { getPublishedProductsByCategorySlug } from "@/lib/products";
import { PAGE_TRANSITION } from "@/lib/motion";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Custom Grillz",
  description:
    "Custom-fit gold and diamond grillz from pluggeo&co — the streetwear-luxury staple, made to order.",
  path: "/grillz",
});

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
        {/* Every published Grillz product, with real pagination (2026-09-02,
            a real report: this used to be `ProductCollectionSection`, the
            same deliberately-capped "curated 4-item preview" pattern Home's
            Bracelet/Pendant Collection sections use on purpose — fine there,
            wrong here, since this dedicated page has nowhere else for the
            rest of the catalog to show up). Same top-level `gap-(--space-9)`
            wrapper `ProductCollectionSection` itself used, so the rhythm
            against GrillzHeroSection/GrillzCastSection is unchanged — see
            `PaginatedProductGrid`'s own comment for the shared paginated-grid
            piece `/category/[slug]` also uses. */}
        <section className="flex flex-col gap-(--space-9)">
          <SectionHeader title="Best Grillz Collection" />
          <PaginatedProductGrid products={products} emptyMessage="No grillz yet — check back soon." />
        </section>
        <GrillzCastSection />
      </div>
    </ViewTransition>
  );
}
