"use client";

import { useMemo, useState } from "react";
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
//
// Category/price/sort filtering is real now too (2026-08-29) — per the
// user: a price-range chip and the custom min/max fields override each
// other (picking a chip resets custom back to the defaults; editing custom
// clears the active chip), so exactly one price filter is ever active at a
// time. Category and price combine (AND, not OR) — an "All" pseudo-category
// is prepended to the real category list so the filter can be cleared.
// Pagination is real (slices the *filtered* list).

const PAGE_SIZE = 8;
const ALL_CATEGORY_ID = "all";

// Numeric bounds for PRICE_RANGES' ids (src/components/price-filter-panel.tsx)
// — that file only defines display labels, so the bounds live here, next to
// the one place that actually filters by them.
const PRICE_RANGE_BOUNDS: Record<string, [number, number]> = {
  "under-500": [0, 500],
  "500-1000": [500, 1000],
  "1000-5000": [1000, 5000],
  "5000-plus": [5000, Infinity],
};

export type ShopPageContentProps = {
  products: StorefrontProductCard[];
  categories: CategoryDialItem[];
};

export function ShopPageContent({ products, categories }: ShopPageContentProps) {
  const categoryItems = useMemo<CategoryDialItem[]>(
    () => [{ id: ALL_CATEGORY_ID, label: "All" }, ...categories],
    [categories]
  );
  const [category, setCategory] = useState(ALL_CATEGORY_ID);
  const [sort, setSort] = useState<SortDirection>("asc");
  const [layout, setLayout] = useState<LayoutValue>("grid");
  const [page, setPage] = useState(1);
  const [spotlightIndex, setSpotlightIndex] = useState(0);

  const [activePriceRange, setActivePriceRange] = useState<string | null>(null);
  const [customPriceOpen, setCustomPriceOpen] = useState(false);
  const [minPrice, setMinPrice] = useState(DEFAULT_MIN_PRICE);
  const [maxPrice, setMaxPrice] = useState(DEFAULT_MAX_PRICE);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // A price chip and the custom range are mutually exclusive — selecting one
  // resets the other back to its default/inactive state, per the user.
  const handlePriceRangeChange = (id: string | null) => {
    setActivePriceRange(id);
    setMinPrice(DEFAULT_MIN_PRICE);
    setMaxPrice(DEFAULT_MAX_PRICE);
  };
  const handleMinPriceChange = (value: string) => {
    setMinPrice(value);
    setActivePriceRange(null);
  };
  const handleMaxPriceChange = (value: string) => {
    setMaxPrice(value);
    setActivePriceRange(null);
  };

  const priceFilter = { activePriceRange, customPriceOpen, minPrice, maxPrice };
  const priceFilterHandlers = {
    onPriceRangeChange: handlePriceRangeChange,
    onCustomPriceOpenChange: setCustomPriceOpen,
    onMinPriceChange: handleMinPriceChange,
    onMaxPriceChange: handleMaxPriceChange,
  };

  const filteredProducts = useMemo(() => {
    let result = products;

    if (category !== ALL_CATEGORY_ID) {
      result = result.filter((p) => p.categorySlug === category);
    }

    if (activePriceRange) {
      const [min, max] = PRICE_RANGE_BOUNDS[activePriceRange] ?? [0, Infinity];
      result = result.filter((p) => p.price >= min && p.price <= max);
    } else if (minPrice !== DEFAULT_MIN_PRICE || maxPrice !== DEFAULT_MAX_PRICE) {
      const min = Number(minPrice) || 0;
      const max = Number(maxPrice) || Infinity;
      result = result.filter((p) => p.price >= min && p.price <= max);
    }

    return [...result].sort((a, b) => (sort === "asc" ? a.price - b.price : b.price - a.price));
  }, [products, category, activePriceRange, minPrice, maxPrice, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedProducts = filteredProducts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );
  const pageDialItems = Array.from({ length: totalPages }, (_, i) => ({
    id: String(i + 1),
    label: String(i + 1),
  }));

  const changePage = (p: number) => {
    setPage(p);
    setSpotlightIndex(0);
  };
  const changeCategory = (id: string) => {
    setCategory(id);
    setPage(1);
    setSpotlightIndex(0);
  };

  return (
    <div className="flex flex-1 gap-(--space-9) py-(--space-9)">
      <ShopSidebar
        categories={categoryItems}
        activeCategory={category}
        onCategoryChange={changeCategory}
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

        {filteredProducts.length === 0 ? (
          <p className="rounded-md border border-border-default py-16 text-center text-body-md text-text-secondary">
            {products.length === 0
              ? "No products yet — check back soon."
              : "No products match your filters."}
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

        {filteredProducts.length > 0 && (
          <>
            <CategoryDial
              items={pageDialItems}
              activeId={String(currentPage)}
              onActiveChange={(id) => changePage(Number(id))}
              orientation="horizontal"
              className="md:hidden"
            />
            <PaginationDial
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={changePage}
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
