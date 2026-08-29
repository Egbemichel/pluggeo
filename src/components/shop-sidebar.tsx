"use client";

import { CategoryDial, type CategoryDialItem } from "@/components/ui/category-dial";
import { PriceFilterPanel, type PriceFilterState } from "@/components/price-filter-panel";
import { cn } from "@/lib/utils";

// Built from the real Figma node (596:644, "shopDesktopSidebar"), broken down per
// the user's instruction into pieces built from *existing* components rather than
// new near-duplicates: the category picker reuses CategoryDial, every chip
// (price-range and min/max) reuses the now-generalized Pill.
//
// 2026-08-28: the "Filter"/Price section (was built inline here) is now the
// shared `PriceFilterPanel`, and its state lives in the parent (ShopPage)
// instead of locally — needed so the new mobile filter drawer/trigger can read
// and drive the exact same state as this desktop sidebar.
//
// 2026-08-29: category list is now real data (`categories`, admin-managed via
// /admin/categories), passed down from ShopPage's Server Component wrapper —
// was a hardcoded 6-item list before, drifting from whatever actually exists
// in the DB the moment an admin adds/renames/removes a category.

export type ShopSidebarProps = {
  categories: CategoryDialItem[];
  activeCategory: string;
  onCategoryChange: (id: string) => void;
  priceFilter: PriceFilterState;
  onPriceRangeChange: (id: string | null) => void;
  onCustomPriceOpenChange: (open: boolean) => void;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
  className?: string;
};

export function ShopSidebar({
  categories,
  activeCategory,
  onCategoryChange,
  priceFilter,
  onPriceRangeChange,
  onCustomPriceOpenChange,
  onMinPriceChange,
  onMaxPriceChange,
  className,
}: ShopSidebarProps) {
  return (
    <div className={cn("flex flex-col gap-(--space-9)", className)}>
      <CategoryDial
        items={categories}
        activeId={activeCategory}
        onActiveChange={onCategoryChange}
      />

      <PriceFilterPanel
        {...priceFilter}
        onPriceRangeChange={onPriceRangeChange}
        onCustomPriceOpenChange={onCustomPriceOpenChange}
        onMinPriceChange={onMinPriceChange}
        onMaxPriceChange={onMaxPriceChange}
      />
    </div>
  );
}
