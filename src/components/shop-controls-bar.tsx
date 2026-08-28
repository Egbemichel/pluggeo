"use client";

import { FilterHorizontalIcon } from "@hugeicons/core-free-icons";
import { SortToggle, type SortDirection } from "@/components/ui/sort-toggle";
import { LayoutToggle, type LayoutValue } from "@/components/ui/layout-toggle";
import { Icon } from "@/components/ui/icon";
import { Divider } from "@/components/ui/divider";
import { cn } from "@/lib/utils";

// Built from the real Figma node (596:602, "shopControlBar") — just SortToggle and
// LayoutToggle (both already built) composed with a bottom divider, nothing new to
// build here.
//
// 2026-08-28: added a mobile-only "Filter" trigger per the user (desktop already
// has this exact row — icon, vertical divider, "Filter" label — visible inline at
// the top of ShopSidebar, which mobile has no access to since that sidebar is
// `hidden` below md). Opens MobileFilterDrawer. The icon "fills" when a price
// filter is active: Hugeicons' free FilterHorizontalIcon is stroke-only, but its
// two "slider handle" sub-paths are closed shapes, so passing Icon a `fill` makes
// just those solid while the straight bar segments (no enclosed area) render
// identically either way — see Icon's own comment for why this works.

export type ShopControlsBarProps = {
  sort: SortDirection;
  onSortChange: (value: SortDirection) => void;
  layout: LayoutValue;
  onLayoutChange: (value: LayoutValue) => void;
  hasActiveFilter: boolean;
  onOpenFilters: () => void;
  className?: string;
};

export function ShopControlsBar({
  sort,
  onSortChange,
  layout,
  onLayoutChange,
  hasActiveFilter,
  onOpenFilters,
  className,
}: ShopControlsBarProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between border-b border-gray pb-(--space-4)",
        className
      )}
    >
      <SortToggle value={sort} onValueChange={onSortChange} />
      <button
        type="button"
        onClick={onOpenFilters}
        aria-haspopup="dialog"
        className="flex items-center gap-(--space-3) md:hidden"
      >
        <Icon
          icon={FilterHorizontalIcon}
          size={20}
          className="text-brand-primary"
          fill={hasActiveFilter ? "currentColor" : undefined}
        />
        <Divider orientation="vertical" length={20} />
        <span className="text-body-md font-sans font-normal text-text-primary">Filter</span>
      </button>
      <LayoutToggle value={layout} onValueChange={onLayoutChange} />
    </div>
  );
}
