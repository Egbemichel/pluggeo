"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Cancel01Icon, Search01Icon, ShoppingBasket01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/icon";
import type { NavBarLink } from "@/components/nav-bar";
import { useDrawerTransition } from "@/hooks/use-drawer-transition";
import { cn } from "@/lib/utils";

type TransitionType = "nav-forward" | "nav-back";
type PendingNav = { href: string; transitionTypes: TransitionType[] };

// Built from the real Figma node (592:536, "mobileNavDrawer") — white panel, black
// 1px border, --shadow-drop, close X top-right, nav links stacked (same Quinn Bold
// style as the desktop nav links, gap ~26px). Opens only from the mobile navbar's
// menu-03 button (see NavBar).
//
// Link text bumped to text-display (96px, the top of the type scale) per the
// user — see NavBar's comment for the full size history; matches the desktop
// links' size exactly, per the user asking for the same treatment on both.
//
// Search/basket icons added below the links, stacked (search first, then
// basket) per the user, at 3x NavBar's desktop icon size (24px -> 72px) — the
// drawer had no way to search or view the basket at all before this.

export type MobileNavDrawerProps = {
  open: boolean;
  onClose: () => void;
  links: NavBarLink[];
  activeHref?: string;
  basketCount?: number;
  onSearchClick: () => void;
};

export function MobileNavDrawer({
  open,
  onClose,
  links,
  activeHref,
  basketCount,
  onSearchClick,
}: MobileNavDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const router = useRouter();
  const [pendingNav, setPendingNav] = useState<PendingNav | null>(null);

  // Navigating away while the drawer is still mid-close-animation used to
  // race the page transition: React's <ViewTransition> calls
  // document.startViewTransition() the instant Link's own navigation fires,
  // and the browser renders that transition's snapshot tree in the "top
  // layer" — which always paints above *any* regular DOM content,
  // including this drawer's `fixed z-50` panel, regardless of z-index. The
  // incoming page would visibly appear on top of the still-animating
  // drawer underneath it. Fixed by intercepting these Links' navigation
  // (`preventDefault`, a pattern Next's own Link explicitly supports),
  // starting the close animation, and only firing the real navigation via
  // `router.push` once `useDrawerTransition`'s `onClosed` confirms the
  // drawer has actually finished and unmounted — by then there's nothing
  // left for the page transition to race against.
  const { mounted, panelRef } = useDrawerTransition({
    open,
    onClosed: () => {
      if (!pendingNav) return;
      router.push(pendingNav.href, { transitionTypes: pendingNav.transitionTypes });
      setPendingNav(null);
    },
  });

  const handleNavClick = (e: React.MouseEvent, href: string, transitionTypes: TransitionType[]) => {
    e.preventDefault();
    setPendingNav({ href, transitionTypes });
    onClose();
  };

  if (!mounted) return null;

  // Portaled to <body> — see SearchOverlay's comment for why: any ancestor
  // between here and <body> that ever picks up a transform/filter/
  // view-transition-name becomes a containing block for this `fixed`
  // overlay instead of the viewport, which is exactly what broke this on
  // PDP (see PROGRESS.md). Portaling removes the whole ancestor chain from
  // the equation.
  return createPortal(
    <div className="fixed inset-0 z-50 md:hidden">
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <div
        ref={panelRef}
        className="absolute top-0 right-0 flex h-full w-[85%] max-w-85.75 flex-col border-l border-black bg-white shadow-(--shadow-drop)"
      >
        <button
          type="button"
          aria-label="Close menu"
          onClick={onClose}
          className="flex size-12 items-center justify-center self-end"
        >
          <Icon icon={Cancel01Icon} size={24} className="text-brand-primary" />
        </button>

        <div className="flex flex-col items-center gap-(--space-6) pt-(--space-9)">
          {links.map((link) => {
            const isActive = link.href === activeHref;
            const transitionTypes: TransitionType[] = [link.href === "/" ? "nav-back" : "nav-forward"];
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href, transitionTypes)}
                transitionTypes={transitionTypes}
                aria-current={isActive ? "page" : undefined}
                data-drawer-item
                className={cn(
                  "text-display font-heading font-bold",
                  isActive ? "text-brand-primary" : "text-text-secondary"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="flex flex-col items-center gap-(--space-6) pt-(--space-9)">
          <button type="button" aria-label="Search" onClick={onSearchClick} data-drawer-item>
            <Icon
              icon={Search01Icon}
              size={72}
              strokeWidth={1.75}
              className="text-brand-primary"
            />
          </button>
          <Link
            href="/bag"
            aria-label="Basket"
            onClick={(e) => handleNavClick(e, "/bag", ["nav-forward"])}
            transitionTypes={["nav-forward"]}
            data-drawer-item
            className="relative inline-flex"
          >
            <Icon
              icon={ShoppingBasket01Icon}
              size={72}
              strokeWidth={1.75}
              className="text-brand-primary"
            />
            {basketCount != null && basketCount > 0 && (
              <span className="absolute -top-1 -right-1 flex size-8 items-center justify-center rounded-full bg-brand-primary font-sans text-sm leading-none font-bold text-white">
                {basketCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </div>,
    document.body
  );
}
