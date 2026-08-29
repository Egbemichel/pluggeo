"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
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
import { useLaggedMount } from "@/hooks/use-lagged-mount";
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
// site shares the same title anyway.
//
// 2026-08-29: gained its own open/close animation (fade + slight vertical
// slide on the backdrop+panel) and deferred-navigation-on-result-click, per
// the user — this used to be an instant `if (!open) return null` with no
// exit state at all, and clicking a result navigated away without ever
// closing the overlay, leaving it floating (portaled to <body>, unaffected
// by the route change) over the destination page. Same root cause as
// MobileNavDrawer's fix (the browser's View Transition top-layer paints
// above regular content regardless of z-index, so a still-open overlay
// visibly races the incoming page) — mounting/unmounting now goes through
// `useLaggedMount` (shared with the drawers) and navigation is deferred
// until the close animation's `onComplete` fires, exactly like
// MobileNavDrawer. Not reusing `useDrawerTransition` directly: that hook's
// animation is a side-slide (`xPercent`) built for a drawer anchored to an
// edge, and this panel is a centered, top-anchored dropdown — a different
// enough shape that forcing it through the same timeline shape would fight
// the actual layout rather than reuse anything meaningful. `useLaggedMount`
// is what's actually shared (the tricky mount-lag-on-close bookkeeping).

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

type TransitionType = "nav-forward" | "nav-back";
type PendingNav = { href: string; transitionTypes: TransitionType[] };

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
  onNavigate,
}: {
  results: ProductLineItem[];
  action: ProductLineItemAction;
  onNavigate: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
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
          <ProductLineItemCard
            product={product}
            action={action}
            onNavigate={(e) => onNavigate(e, product.href)}
          />
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
  const router = useRouter();
  const [pendingNav, setPendingNav] = useState<PendingNav | null>(null);
  const [mounted, setMounted] = useLaggedMount(open);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const onClosedRef = useRef<(() => void) | null>(null);

  // Module-level constants can't call hooks, so the action object (needs
  // `fly` from context) is built once per render here instead — cheap,
  // and PLACEHOLDER_RESULTS.map already creates new element props every
  // render regardless.
  const addToBagAction = {
    label: "Add to bag",
    icon: ShoppingBagAddIcon,
    onClick: (sourceEl: HTMLButtonElement) => fly(sourceEl),
  };

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleResultNavigate = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      e.preventDefault();
      setPendingNav({ href, transitionTypes: ["nav-forward"] });
      onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, handleClose]);

  // Fires once the close animation genuinely finishes — resets `query` here
  // (not immediately on close-start) so results don't vanish out from under
  // the still-fading panel, and fires the deferred navigation, if any, only
  // once nothing is left to race against. Kept current via a layout effect
  // (not written during render) so a fresh closure each render doesn't
  // itself count as a ref write during render under this project's lint
  // config — same pattern as use-viewport-enter.ts's onEnterRef.
  useLayoutEffect(() => {
    onClosedRef.current = () => {
      setQuery("");
      if (pendingNav) {
        router.push(pendingNav.href, { transitionTypes: pendingNav.transitionTypes });
        setPendingNav(null);
      }
    };
  });

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell || !mounted) return;

    const mm = gsap.matchMedia();

    if (open) {
      mm.add(MOTION_QUERY.full, () => {
        const tween = gsap.fromTo(
          shell,
          { opacity: 0, y: -12 },
          { opacity: 1, y: 0, duration: DURATION.drawer, ease: EASE.drawerOpen }
        );
        return () => tween.kill();
      });
      mm.add(MOTION_QUERY.reduced, () => {
        gsap.set(shell, { opacity: 1, y: 0 });
      });
    } else {
      mm.add(MOTION_QUERY.full, () => {
        const tween = gsap.to(shell, {
          opacity: 0,
          y: -12,
          duration: DURATION.drawer,
          ease: EASE.drawerClose,
          onComplete: () => {
            setMounted(false);
            onClosedRef.current?.();
          },
        });
        return () => tween.kill();
      });
      mm.add(MOTION_QUERY.reduced, () => {
        const tween = gsap.to(shell, {
          opacity: 0,
          duration: 0.15,
          onComplete: () => {
            setMounted(false);
            onClosedRef.current?.();
          },
        });
        return () => tween.kill();
      });
    }

    return () => mm.revert();
  }, [open, mounted, setMounted]);

  if (!mounted) return null;

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

      <div
        ref={shellRef}
        className="absolute inset-x-0 top-0 flex justify-center px-6 py-(--space-9) md:px-10"
      >
        <div className="flex w-full max-w-2xl flex-col gap-(--space-6) rounded-md border border-black bg-white p-(--space-6) shadow-(--shadow-drop) md:p-(--space-7)">
          <div className="flex items-center gap-(--space-4)">
            <SearchInput
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
            />
            <button type="button" aria-label="Close search" onClick={handleClose}>
              <Icon icon={Cancel01Icon} size={24} className="text-brand-primary" />
            </button>
          </div>

          {query.trim() !== "" && (
            <SearchResults
              results={PLACEHOLDER_RESULTS}
              action={addToBagAction}
              onNavigate={handleResultNavigate}
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
