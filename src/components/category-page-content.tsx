"use client";

import Link from "next/link";
import { SectionHeader } from "@/components/section-header";
import { ProductGrid } from "@/components/product-grid";
import { PaginatedProductGrid } from "@/components/paginated-product-grid";
import { Button } from "@/components/ui/button";
import type { StorefrontProductCard } from "@/lib/products";

// Generic per-category template (`/category/[slug]`) — per the user, every
// piece here is an *existing* component just wired up with the category's
// data, not new UI: SectionHeader (title+tagline row, and again for "More
// from us" with no viewAllHref/chevron — this one just has a standalone
// "Explore more" button below its grid instead), PaginatedProductGrid
// (desktop/mobile split-render + real numeric pagination, shared with the
// Grillz page — see that component's own comment), ProductGrid (the
// "More from us" grid doesn't paginate, so it's used directly here), Button.
// NavBar's back-button variant (see its own comment) covers the header row
// above this. Footer is already global via StorefrontLayout, nothing to add
// here for it.
//
// Real category data (2026-08-29) — `products`/`moreProducts` come from the
// Server Component wrapper's real query (src/lib/products.ts), replacing
// the old per-category placeholder generator. Pagination is real (slices
// `products` client-side); "More from us" has no pagination of its own,
// matching the original design (one grid, no page control).

export type CategoryPageContentProps = {
  category: string;
  tagline: string;
  products: StorefrontProductCard[];
  moreProducts: StorefrontProductCard[];
};

export function CategoryPageContent({
  category,
  tagline,
  products,
  moreProducts,
}: CategoryPageContentProps) {
  return (
    <div className="flex flex-1 flex-col gap-(--space-9) py-(--space-9)">
      <SectionHeader title={category} subtitle={tagline} />

      <PaginatedProductGrid products={products} emptyMessage={`No products in ${category} yet — check back soon.`} />

      {moreProducts.length > 0 && (
        <>
          <SectionHeader title="More from us" subtitle="WITNESS LUXURY, FIRST HAND" />

          <ProductGrid products={moreProducts} columns={3} className="hidden md:grid" />
          <ProductGrid products={moreProducts} columns={2} className="md:hidden" />
        </>
      )}

      <div className="flex flex-wrap items-center gap-(--space-4)">
        <Button
          render={
            <Link href="/shop" transitionTypes={["nav-forward"]}>
              Explore more
            </Link>
          }
          height={64}
          textSize={28}
        />
      </div>
    </div>
  );
}
