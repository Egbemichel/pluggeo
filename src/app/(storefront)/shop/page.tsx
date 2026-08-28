"use client";

import { ViewTransition } from "react";
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
import { CategoryDial } from "@/components/ui/category-dial";
import { Divider } from "@/components/ui/divider";
import type { LayoutValue } from "@/components/ui/layout-toggle";
import type { SortDirection } from "@/components/ui/sort-toggle";
import { PAGE_TRANSITION } from "@/lib/motion";

// The Figma sidebar (596:644) was named "shopDesktopSidebar" specifically — no
// mobile variant was provided, so it's desktop-only here (hidden below md) until
// one is.

const PLACEHOLDER_IMAGE = { src: "/placeholder-product.svg", alt: "Placeholder product" };
const TOTAL_PAGES = 12;
const PAGE_DIAL_ITEMS = Array.from({ length: TOTAL_PAGES }, (_, i) => ({
  id: String(i + 1),
  label: String(i + 1),
}));

// `images` (plural) backs ProductSpotlight's coverflow; `image`/`imageCount`
// (already what ProductCard/Indicator expect) are just derived from it so the
// grid/list cards and the spotlight agree on how many photos each product has,
// instead of the spotlight inventing separate counts. Varying 1-3 per item just
// to exercise the spotlight's neighbor-tile logic with real variety — offset so
// index 0 (the one ProductSpotlight auto-selects) gets 3, actually showing the
// coverflow, rather than 1 (the plain `i % 3` result for i=0).
const PLACEHOLDER_PRODUCTS = Array.from({ length: 6 }, (_, i) => {
  const images = Array.from({ length: ((i + 2) % 3) + 1 }, () => PLACEHOLDER_IMAGE);
  return {
    key: `placeholder-${i}`,
    href: `/product/placeholder-${i}`,
    image: images[0],
    images,
    imageCount: images.length,
    category: "Bracelets",
    title: "22mm chain with custom clasp",
    price: 5800,
    compareAtPrice: 7650,
    isFromPrice: true,
  };
});

export default function ShopPage() {
  const [category, setCategory] = useState("bracelets");
  const [sort, setSort] = useState<SortDirection>("asc");
  const [layout, setLayout] = useState<LayoutValue>("grid");
  const [page, setPage] = useState(1);
  // "products[0] auto-selects" per the user, then clicking any row below
  // re-selects which product feeds ProductSpotlight instead of navigating away.
  const [spotlightIndex, setSpotlightIndex] = useState(0);

  // Lifted out of ShopSidebar so the mobile Filter trigger/drawer in
  // ShopControlsBar can read and drive the exact same price-filter state as the
  // desktop sidebar, rather than each owning a separate copy.
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

  return (
    <ViewTransition {...PAGE_TRANSITION}>
      <div className="flex flex-1 gap-(--space-9) py-(--space-9)">
        {/* Sticky per the user: this is a sidebar, it shouldn't scroll away with
            the grid/list content — `self-start` keeps its height to its own
            content (not stretched by the flex row) so `sticky` can actually
            release once its content runs out, instead of pinning for the whole
            page. Desktop only, matching the sidebar's own existing md:flex. */}
        <ShopSidebar
          activeCategory={category}
          onCategoryChange={setCategory}
          priceFilter={priceFilter}
          {...priceFilterHandlers}
          className="hidden w-70 shrink-0 self-start md:sticky md:top-10 md:flex"
        />

        {/* Separates the sidebar from the product content, regardless of layout —
            desktop only (mobile has no sidebar to separate from). */}
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

          {layout === "grid" ? (
            <>
              {/* Desktop shows 4 columns, mobile keeps the existing 2 — same
                  split-render pattern ProductCollectionSection already uses,
                  since a single grid's column count can't vary by breakpoint
                  through one JS-computed inline style. */}
              <ProductGrid products={PLACEHOLDER_PRODUCTS} columns={4} className="hidden md:grid" />
              <ProductGrid products={PLACEHOLDER_PRODUCTS} columns={2} className="md:hidden" />
            </>
          ) : (
            <>
              {/* Figma node 596:600 ("imageGallery") — sits above the repeated
                  list rows, ProductList's own comment already flagged this node
                  as unbuilt. products[0] auto-selects on open; clicking any row
                  below re-selects (ProductCard's row layout swaps its Link for a
                  selecting <button> whenever `onSelect` is passed) rather than
                  navigating away — the spotlight's own "Details" button is the
                  real navigation.
                  `key={product.href}` forces a fresh ProductSpotlight instance
                  per product instead of reusing one across selections — without
                  it, its internal image index carried over from whichever
                  product was active before, so selecting a product with fewer
                  photos than that stale index could show a blank coverflow, and
                  even when in-bounds it violated "the large center image is
                  always what's first shown" per the user. A remount is simpler
                  and just as correct here since nothing animates *between*
                  different products being selected (only paging within one
                  product's own photos animates).
                  Spotlight + the divider under it are sticky together (one
                  wrapper, `bg-background` so the scrolling list doesn't show
                  through) inside their OWN shared container with the list —
                  that container (not the outer column, which also holds the
                  pagination dial) is what sticky releases against, so it stops
                  pinning right as the list ends instead of colliding with
                  pagination further down. `top-0` (not `top-10`): a 40px gap
                  between the viewport edge and the sticky block let scrolled-out
                  list rows visually peek through that gap as they passed behind
                  it — both bugs confirmed live, not guessed. */}
              <div className="relative flex flex-col gap-(--space-6)">
                <div className="sticky top-0 z-10 flex flex-col gap-(--space-6) bg-background pb-(--space-6)">
                  <ProductSpotlight
                    key={PLACEHOLDER_PRODUCTS[spotlightIndex].href}
                    product={PLACEHOLDER_PRODUCTS[spotlightIndex]}
                  />
                  <Divider orientation="horizontal" />
                </div>
                <ProductList
                  products={PLACEHOLDER_PRODUCTS.map((product, i) => ({
                    ...product,
                    onSelect: () => setSpotlightIndex(i),
                    selected: i === spotlightIndex,
                  }))}
                />
              </div>
            </>
          )}

          {/* Mobile pagination reuses CategoryDial's z-axis coverflow (same
              component/mechanic as CelebrityShowcase's mobile @handle picker),
              with page numbers as labels — same for both grid and list layout,
              per the user. Desktop keeps the existing flat PaginationDial,
              same for both layouts too. */}
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
        </div>

        <MobileFilterDrawer
          open={filterDrawerOpen}
          onClose={() => setFilterDrawerOpen(false)}
          priceFilter={priceFilter}
          {...priceFilterHandlers}
        />
      </div>
    </ViewTransition>
  );
}
