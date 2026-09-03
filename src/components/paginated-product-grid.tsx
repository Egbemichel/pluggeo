"use client";

import { useState } from "react";
import { ProductGrid } from "@/components/product-grid";
import { PaginationDial } from "@/components/ui/pagination-dial";
import { CategoryDial } from "@/components/ui/category-dial";
import type { StorefrontProductCard } from "@/lib/products";

// Extracted from `CategoryPageContent` (2026-09-02, a real report: the
// Grillz page only ever showed 4 of its products, capped by
// `ProductCollectionSection`'s deliberate "curated preview" design — the
// same pattern Home's Bracelet/Pendant Collection sections use on purpose.
// Grillz's dedicated page isn't a curated preview though — per the owner,
// it should show every published Grillz product, with real pagination —
// exactly what `CategoryPageContent`'s own main grid already does for
// `/category/[slug]`. Pulled that block out into its own component instead
// of duplicating it, so both pages share one paginated-grid implementation.

const PAGE_SIZE = 8;

export type PaginatedProductGridProps = {
  products: StorefrontProductCard[];
  /** Shown instead of the grid when `products` is empty. */
  emptyMessage: string;
};

export function PaginatedProductGrid({ products, emptyMessage }: PaginatedProductGridProps) {
  const [page, setPage] = useState(1);

  if (products.length === 0) {
    return (
      <p className="rounded-md border border-border-default py-16 text-center text-body-md text-text-secondary">
        {emptyMessage}
      </p>
    );
  }

  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedProducts = products.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const pageDialItems = Array.from({ length: totalPages }, (_, i) => ({
    id: String(i + 1),
    label: String(i + 1),
  }));

  return (
    <>
      {/* 3 columns desktop / 2 mobile — real per-category browsing, not a
          fixed-count curated section, so bigger cards cost nothing
          structurally (same reasoning as Shop's and CategoryPageContent's
          own grids). */}
      <ProductGrid products={pagedProducts} columns={3} className="hidden md:grid" />
      <ProductGrid products={pagedProducts} columns={2} className="md:hidden" />

      <CategoryDial
        items={pageDialItems}
        activeId={String(currentPage)}
        onActiveChange={(id) => setPage(Number(id))}
        orientation="horizontal"
        className="md:hidden"
      />
      <PaginationDial
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setPage}
        className="hidden md:flex"
      />
    </>
  );
}
