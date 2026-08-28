"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { Cancel01Icon, ShoppingBagAddIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/icon";
import { SearchInput } from "@/components/ui/search-input";
import {
  ProductLineItemCard,
  type ProductLineItem,
  type ProductLineItemAction,
} from "@/components/product-line-item-card";
import { useBagFlight } from "@/components/bag-flight-provider";
import { DURATION, EASE, MOTION_QUERY, STAGGER } from "@/lib/motion";

// Opens from either NavBar's desktop search icon or MobileNavDrawer's search
// icon (see NavBar's own comment for the shared open-state wiring) — built
// from a pasted screenshot, no Figma node/link. Same dismiss pattern
// MobileNavDrawer already established: backdrop click + Escape key.
//
// No real search backend/catalog query exists yet — typing anything shows
// the same placeholder result set (same shape ProductLineItemCard needs:
// size/width/gold color/gold type alongside the usual title/category/price)
// rather than actually filtering, since every placeholder product on the
// site shares the same title anyway. Query clears on close so reopening
// starts fresh instead of showing stale results.

const PLACEHOLDER_IMAGE = { src: "/placeholder-product.svg", alt: "Placeholder product" };

const PLACEHOLDER_RESULTS: ProductLineItem[] = [
  {
    href: "/product/placeholder-0",
    image: PLACEHOLDER_IMAGE,
    title: "22mm chain with custom clasp",
    category: "Bracelets",
    size: "6.5 Inch",
    width: "5.5 mm",
    goldColor: "Rose",
    goldType: "14k",
    price: 5800,
    compareAtPrice: 7650,
    isFromPrice: true,
  },
  {
    href: "/product/placeholder-1",
    image: PLACEHOLDER_IMAGE,
    title: "22mm chain with custom clasp",
    category: "Chains",
    size: "20 Inch",
    width: "7 mm",
    goldColor: "Yellow",
    goldType: "18k",
    price: 5800,
    compareAtPrice: 7650,
    isFromPrice: true,
  },
];

// Results fade in top-to-bottom, staggered, as they populate — per the user.
// No real search backend exists (see file comment above), so "populate" is
// simply the query going from empty to non-empty, which is exactly when this
// component mounts; the stagger runs once per mount rather than needing its
// own state to detect "did results just appear," and remounts naturally (so
// it replays) whenever the query is cleared back to empty and typed again.
// Always-run, not viewport-gated — the overlay is a fixed layer already on
// screen, this is interaction-triggered like the dial wave or add-to-bag.
function SearchResults({
  results,
  action,
}: {
  results: ProductLineItem[];
  action: ProductLineItemAction;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const mm = gsap.matchMedia();

    mm.add(MOTION_QUERY.full, () => {
      const targets = container.querySelectorAll<HTMLElement>("[data-reveal-item]");
      const tween = gsap.fromTo(
        targets,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: DURATION.entranceSm, ease: EASE.standard, stagger: STAGGER.list }
      );
      return () => tween.kill();
    });

    mm.add(MOTION_QUERY.reduced, () => {
      const targets = container.querySelectorAll<HTMLElement>("[data-reveal-item]");
      const tween = gsap.fromTo(targets, { opacity: 0 }, { opacity: 1, duration: 0.15 });
      return () => tween.kill();
    });

    return () => mm.revert();
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col gap-(--space-4)">
      {results.map((product) => (
        <div key={product.href} data-reveal-item>
          <ProductLineItemCard product={product} action={action} />
        </div>
      ))}
    </div>
  );
}

export type SearchOverlayProps = {
  open: boolean;
  onClose: () => void;
};

export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const { fly } = useBagFlight();
  // Module-level constants can't call hooks, so the action object (needs
  // `fly` from context) is built once per render here instead — cheap,
  // and PLACEHOLDER_RESULTS.map already creates new element props every
  // render regardless.
  const addToBagAction = {
    label: "Add to bag",
    icon: ShoppingBagAddIcon,
    onClick: (sourceEl: HTMLButtonElement) => fly(sourceEl),
  };

  // Resets the query in the same handler that closes the overlay (rather
  // than an effect watching `open`) so reopening always starts fresh —
  // setState directly inside an effect body causes cascading renders.
  const handleClose = useCallback(() => {
    setQuery("");
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, handleClose]);

  if (!open) return null;

  // Portaled straight to <body> rather than rendered in place — this overlay
  // relies on `position: fixed` spanning the full viewport, and ANY ancestor
  // between here and <body> that ever gets a `transform`/`filter`/
  // `perspective`/`will-change: transform`/`view-transition-name` (GSAP
  // reveal animations leave inline `transform`s behind, and every page.tsx's
  // <ViewTransition> can do this too) becomes a containing block for fixed
  // descendants instead of the viewport, trapping the overlay inside
  // whatever box that ancestor happens to be — exactly the bug that broke
  // this on PDP (see PROGRESS.md). Portaling out of the React tree entirely
  // makes that whole class of bug structurally impossible here, not just
  // patched for the one ancestor that caused it. `open` already gates this
  // to client-only interaction (never true during SSR), so `document` is
  // always available by the time this branch runs.
  return createPortal(
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close search"
        onClick={handleClose}
        className="absolute inset-0 bg-black/40"
      />

      <div className="absolute inset-x-0 top-0 flex justify-center px-6 py-(--space-9) md:px-10">
        <div className="flex w-full max-w-2xl flex-col gap-(--space-6) rounded-md border border-black bg-white p-(--space-6) shadow-(--shadow-drop) md:p-(--space-7)">
          <div className="flex items-center gap-(--space-4)">
            <SearchInput
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
            />
            <button type="button" aria-label="Close search" onClick={onClose}>
              <Icon icon={Cancel01Icon} size={24} className="text-brand-primary" />
            </button>
          </div>

          {query.trim() !== "" && (
            <SearchResults results={PLACEHOLDER_RESULTS} action={addToBagAction} />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
