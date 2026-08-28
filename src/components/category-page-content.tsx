"use client";

import { useState } from "react";
import Link from "next/link";
import { SectionHeader } from "@/components/section-header";
import { ProductGrid } from "@/components/product-grid";
import { PaginationDial } from "@/components/ui/pagination-dial";
import { CategoryDial } from "@/components/ui/category-dial";
import { Button } from "@/components/ui/button";

// Generic per-category template (`/category/[slug]`) — per the user, every
// piece here is an *existing* component just wired up with the category's
// data, not new UI: SectionHeader (title+tagline row, and again for "More
// from us" with no viewAllHref/chevron — this one just has a standalone
// "Explore more" button below its grid instead), ProductGrid (desktop/mobile
// split-render, same pattern Shop already uses), PaginationDial/CategoryDial
// for desktop/mobile numeric pagination (same pair Shop's mobile pagination
// already uses), Button. NavBar's back-button variant (see its own comment)
// covers the header row above this. Footer is already global via
// StorefrontLayout, nothing to add here for it.
//
// Placeholder product/pagination data — no real catalog/category API yet.

const PLACEHOLDER_IMAGE = { src: "/placeholder-product.svg", alt: "Placeholder product" };
const TOTAL_PAGES = 6;
const PAGE_DIAL_ITEMS = Array.from({ length: TOTAL_PAGES }, (_, i) => ({
  id: String(i + 1),
  label: String(i + 1),
}));

function makePlaceholderProducts(category: string, prefix: string, count: number) {
  return Array.from({ length: count }, (_, i) => ({
    key: `${prefix}-${i}`,
    href: `/product/placeholder-${prefix}-${i}`,
    image: PLACEHOLDER_IMAGE,
    category,
    title: "22mm chain with custom clasp",
    price: 5800,
    compareAtPrice: 7650,
    isFromPrice: true,
  }));
}

export type CategoryPageContentProps = {
  /** Title-cased category label, e.g. "Bracelets" — used both as the page
   * heading and each placeholder product's own category field. */
  category: string;
  /** Short tagline beside the category name, e.g. "Classy and premium". */
  tagline: string;
};

export function CategoryPageContent({ category, tagline }: CategoryPageContentProps) {
  const [page, setPage] = useState(1);

  const gridProducts = makePlaceholderProducts(category, "grid", 8);
  const moreProducts = makePlaceholderProducts(category, "more", 4);

  return (
    <div className="flex flex-1 flex-col gap-(--space-9) py-(--space-9)">
      <SectionHeader title={category} subtitle={tagline} />

      <ProductGrid products={gridProducts} columns={4} className="hidden md:grid" />
      <ProductGrid products={gridProducts} columns={2} className="md:hidden" />

      <CategoryDial
        items={PAGE_DIAL_ITEMS}
        activeId={String(page)}
        onActiveChange={(id) => setPage(Number(id))}
        orientation="horizontal"
        className="md:hidden"
      />
      <PaginationDial
        currentPage={page}
        totalPages={TOTAL_PAGES}
        onPageChange={setPage}
        className="hidden md:flex"
      />

      <SectionHeader title="More from us" subtitle="WITNESS LUXURY, FIRST HAND" />

      <ProductGrid products={moreProducts} columns={4} className="hidden md:grid" />
      <ProductGrid products={moreProducts} columns={2} className="md:hidden" />

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
