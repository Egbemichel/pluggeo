"use client";

import { useState } from "react";
import { ShopSidebar } from "@/components/shop-sidebar";
import { ShopControlsBar } from "@/components/shop-controls-bar";
import { MobileFilterDrawer } from "@/components/mobile-filter-drawer";
import {
  DEFAULT_MIN_PRICE,
  DEFAULT_MAX_PRICE,
  hasActivePriceFilter,
} from "@/components/price-filter-panel";
import { ProductGrid } from "@/components/product-grid";
import { ProductList } from "@/components/product-list";
import { ProductSpotlight } from "@/components/product-spotlight";
import { PaginationDial } from "@/components/ui/pagination-dial";
import { CategoryDial, type CategoryDialItem } from "@/components/ui/category-dial";
import { Divider } from "@/components/ui/divider";
import type { LayoutValue } from "@/components/ui/layout-toggle";
import type { SortDirection } from "@/components/ui/sort-toggle";
import type { StorefrontProductCard } from "@/lib/products";

// Real catalog data (2026-08-29), replacing the old hardcoded 6-item
// placeholder array — `products` is the full published catalog, fetched
// once by the Server Component wrapper (page.tsx) via `getPublishedProducts()`.
// Pagination is now real (slices `products` by `PAGE_SIZE`, `TOTAL_PAGES`
// derived from the actual count) — it was decorative before (a hardcoded
// `TOTAL_PAGES = 12` unrelated to what was actually shown).
//
// Category/price/sort controls are DELIBERATELY still decorative — they
// always were (clicking a category or price chip never filtered the old
// placeholder grid either), and implementing real filtering means real
// product-design decisions (does a price chip override custom min/max? does
// category filtering combine with price?) that weren't part of what was
// asked ("no more placeholders" was about the data source, not new filter
// behavior). Flagged as a real, known follow-up rather than silently left
// looking finished — see PROGRESS.md.

const PAGE_SIZE = 8;

export type ShopPageContentProps = {
  products: StorefrontProductCard[];
  categories: CategoryDialItem[];
};

export function ShopPageContent({ products, categories }: ShopPageContentProps) {
  const [category, setCategory] = useState(categories[0]?.id ?? "");
  const [sort, setSort] = useState<SortDirection>("asc");
  const [layout, setLayout] = useState<LayoutValue>("grid");
  const [page, setPage] = useState(1);
  const [spotlightIndex, setSpotlightIndex] = useState(0);

  const [activePriceRange, setActivePriceRange] = useState<string | null>(null);
  const [customPriceOpen, setCustomPriceOpen] = useState(false);
  const [minPrice, setMinPrice] = useState(DEFAULT_MIN_PRICE);
  const [maxPrice, setMaxPrice] = useState(DEFAULT_MAX_PRICE);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const priceFilter = { activePriceRange, customPriceOpen, minPrice, maxPrice };
  const priceFilterHandlers = {
    onPriceRangeChange: setActivePriceRange,
    onCustomPriceOpenChange: setCustomPriceOpen,
    onMinPriceChange: setMinPrice,
    onMaxPriceChange: setMaxPrice,
  };

  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const pagedProducts = products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageDialItems = Array.from({ length: totalPages }, (_, i) => ({
    id: String(i + 1),
    label: String(i + 1),
  }));

  return (
    <div className="flex flex-1 gap-(--space-9) py-(--space-9)">
      <ShopSidebar
        categories={categories}
        activeCategory={category}
        onCategoryChange={setCategory}
        priceFilter={priceFilter}
        {...priceFilterHandlers}
        className="hidden w-70 shrink-0 self-start md:sticky md:top-10 md:flex"
      />

      <Divider orientation="vertical" className="hidden md:block" />

      <div className="flex flex-1 flex-col gap-(--space-9)">
        <ShopControlsBar
          sort={sort}
          onSortChange={setSort}
          layout={layout}
          onLayoutChange={setLayout}
          hasActiveFilter={hasActivePriceFilter(priceFilter)}
          onOpenFilters={() => setFilterDrawerOpen(true)}
        />

        {products.length === 0 ? (
          <p className="rounded-md border border-border-default py-16 text-center text-body-md text-text-secondary">
            No products yet — check back soon.
          </p>
        ) : layout === "grid" ? (
          <>
            <ProductGrid products={pagedProducts} columns={4} className="hidden md:grid" />
            <ProductGrid products={pagedProducts} columns={2} className="md:hidden" />
          </>
        ) : (
          <div className="relative flex flex-col gap-(--space-6)">
            <div className="sticky top-0 z-10 flex flex-col gap-(--space-6) bg-background pb-(--space-6)">
              {pagedProducts[spotlightIndex] && (
                <ProductSpotlight
                  key={pagedProducts[spotlightIndex].href}
                  product={pagedProducts[Math.min(spotlightIndex, pagedProducts.length - 1)]}
                />
              )}
              <Divider orientation="horizontal" />
            </div>
            <ProductList
              products={pagedProducts.map((product, i) => ({
                ...product,
                onSelect: () => setSpotlightIndex(i),
                selected: i === spotlightIndex,
              }))}
            />
          </div>
        )}

        {products.length > 0 && (
          <>
            <CategoryDial
              items={pageDialItems}
              activeId={String(page)}
              onActiveChange={(id) => {
                setPage(Number(id));
                setSpotlightIndex(0);
              }}
              orientation="horizontal"
              className="md:hidden"
            />
            <PaginationDial
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => {
                setPage(p);
                setSpotlightIndex(0);
              }}
              className="hidden md:flex"
            />
          </>
        )}
      </div>

      <MobileFilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        priceFilter={priceFilter}
        {...priceFilterHandlers}
      />
    </div>
  );
}
