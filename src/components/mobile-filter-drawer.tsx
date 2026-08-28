"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/icon";
import { PriceFilterPanel, type PriceFilterState } from "@/components/price-filter-panel";
import { useDrawerTransition } from "@/hooks/use-drawer-transition";

// Same overlay/slide-in-panel pattern as MobileNavDrawer (white panel, black 1px
// border, --shadow-drop, close X top-right) — opens from the new "Filter" trigger
// in ShopControlsBar (mobile only). Renders the same PriceFilterPanel the desktop
// sidebar uses, driven by the same lifted state, so filtering behaves identically
// regardless of which UI triggered it.

export type MobileFilterDrawerProps = {
  open: boolean;
  onClose: () => void;
  priceFilter: PriceFilterState;
  onPriceRangeChange: (id: string | null) => void;
  onCustomPriceOpenChange: (open: boolean) => void;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
};

export function MobileFilterDrawer({
  open,
  onClose,
  priceFilter,
  onPriceRangeChange,
  onCustomPriceOpenChange,
  onMinPriceChange,
  onMaxPriceChange,
}: MobileFilterDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const { mounted, panelRef } = useDrawerTransition({ open });

  if (!mounted) return null;

  // Portaled to <body> — unlike SearchOverlay/MobileNavDrawer (confirmed
  // broken by NavBar's `viewTransitionName`, see PROGRESS.md), this one
  // measured fine in testing. But it's rendered from inside /shop's own
  // page.tsx, i.e. nested under that page's <ViewTransition> wrapper same as
  // any future fixed-position overlay would be — and any ancestor that ever
  // picks up a transform/filter/view-transition-name becomes a containing
  // block for `position: fixed` descendants instead of the viewport. Portaled
  // preventively for the same reason, so this can't become the next instance
  // of the same bug class.
  return createPortal(
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        type="button"
        aria-label="Close filters"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <div
        ref={panelRef}
        className="absolute top-0 right-0 flex h-full w-[85%] max-w-85.75 flex-col gap-(--space-7) border-l border-black bg-white p-(--space-7) shadow-(--shadow-drop)"
      >
        <button
          type="button"
          aria-label="Close filters"
          onClick={onClose}
          className="flex size-12 items-center justify-center self-end"
        >
          <Icon icon={Cancel01Icon} size={24} className="text-brand-primary" />
        </button>

        <PriceFilterPanel
          {...priceFilter}
          onPriceRangeChange={onPriceRangeChange}
          onCustomPriceOpenChange={onCustomPriceOpenChange}
          onMinPriceChange={onMinPriceChange}
          onMaxPriceChange={onMaxPriceChange}
        />
      </div>
    </div>,
    document.body
  );
}
