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

const CATEGORIES: CategoryDialItem[] = [
  { id: "watches", label: "Watches" },
  { id: "chains", label: "Chains" },
  { id: "pendants", label: "Pendants" },
  { id: "bracelets", label: "Bracelets" },
  { id: "sets", label: "Sets" },
  { id: "grillz", label: "Grillz" },
];

export type ShopSidebarProps = {
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
        items={CATEGORIES}
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
