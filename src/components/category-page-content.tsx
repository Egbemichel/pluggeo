"use client";

import { useState } from "react";
import Link from "next/link";
import { SectionHeader } from "@/components/section-header";
import { ProductGrid } from "@/components/product-grid";
import { PaginationDial } from "@/components/ui/pagination-dial";
import { CategoryDial } from "@/components/ui/category-dial";
import { Button } from "@/components/ui/button";
import type { StorefrontProductCard } from "@/lib/products";

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
// Real category data (2026-08-29) — `products`/`moreProducts` come from the
// Server Component wrapper's real query (src/lib/products.ts), replacing
// the old per-category placeholder generator. Pagination is real (slices
// `products` client-side by `PAGE_SIZE`); "More from us" has no pagination
// of its own, matching the original design (one grid, no page control).

const PAGE_SIZE = 8;

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
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const pagedProducts = products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageDialItems = Array.from({ length: totalPages }, (_, i) => ({
    id: String(i + 1),
    label: String(i + 1),
  }));

  return (
    <div className="flex flex-1 flex-col gap-(--space-9) py-(--space-9)">
      <SectionHeader title={category} subtitle={tagline} />

      {products.length === 0 ? (
        <p className="rounded-md border border-border-default py-16 text-center text-body-md text-text-secondary">
          No products in {category} yet — check back soon.
        </p>
      ) : (
        <>
          {/* 4 → 3 columns, same reasoning as Shop's grid layout (see its own
              comment) — real per-category browsing, not a fixed-count
              curated section, so bigger cards cost nothing structurally. */}
          <ProductGrid products={pagedProducts} columns={3} className="hidden md:grid" />
          <ProductGrid products={pagedProducts} columns={2} className="md:hidden" />

          <CategoryDial
            items={pageDialItems}
            activeId={String(page)}
            onActiveChange={(id) => setPage(Number(id))}
            orientation="horizontal"
            className="md:hidden"
          />
          <PaginationDial
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            className="hidden md:flex"
          />
        </>
      )}

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
