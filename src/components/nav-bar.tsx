"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search01Icon, ShoppingBasket01Icon, Menu03Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/icon";
import { MobileNavDrawer } from "@/components/mobile-nav-drawer";
import { SearchOverlay } from "@/components/search-overlay";
import { BackButton } from "@/components/ui/back-button";
import { GrillzTopBleedImage } from "@/components/grillz-top-bleed-image";
import { useBagFlight } from "@/components/bag-flight-provider";
import { cn } from "@/lib/utils";

// Built from the real Figma node (566:6255), then reworked per the user's explicit
// layout spec (not fully what the raw node showed):
// - Desktop: logo+links centered in the viewport, search/basket pinned to the far
//   right (3-column grid: empty / centered content / right-aligned icons).
// - Mobile: logo centered, a 48x48 Hugeicons menu-03 button at the far right that
//   opens MobileNavDrawer.
//
// Active link color: the user described it as "brand-accent" but the only matching
// captured token is `brand-primary` (navy) — used here, flag if a distinct
// brand-accent token exists that wasn't part of what got pulled.
//
// Link text size: originally text-h4 (28px, the measured Figma value), bumped to
// text-h2 (48px) per an accessibility ask, then bumped again to text-display
// (96px, the largest token in the scale) per the user asking for "much much
// bigger... 5x" — deliberately far larger than Figma's own spec, not a fidelity
// fix. Same size applied to MobileNavDrawer's links for consistency.
//
// The basket icon (Hugeicons "shopping-basket-01", plain) has an unconfirmed
// destination/behavior — there's no checkout in scope, so this likely isn't a real
// cart. Left as a plain link for now, same flag as ProductCard's basket button.
//
// Search: SearchOverlay's open state lives here (not inside it) since two
// separate triggers need to open the same instance — the desktop search
// icon below, and MobileNavDrawer's own search icon (which also has to
// close the drawer first, hence the combined handler passed as
// `onSearchClick` rather than teaching MobileNavDrawer about the overlay
// directly).

export type NavBarLink = { label: string; href: string };

export type NavBarProps = {
  links?: NavBarLink[];
  activeHref?: string;
  basketCount?: number;
  className?: string;
};

const DEFAULT_LINKS: NavBarLink[] = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
];

export function NavBar({
  links = DEFAULT_LINKS,
  activeHref,
  basketCount: basketCountProp,
  className,
}: NavBarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  // BagFlightProvider owns the real count (incremented when a flying
  // Add-to-Bag icon lands here); `basketCount` stays as an explicit
  // override for anyone who needs one, same convention as `activeHref`.
  const { registerTarget, basketCount: contextBasketCount } = useBagFlight();
  const basketCount = basketCountProp ?? contextBasketCount;
  // `activeHref` defaulted to "/" with no caller ever passing the real one — the
  // active link was stuck on Home on every page. NavBar is already a Client
  // Component, so derive it from the actual URL instead; the prop stays as an
  // explicit override for anyone who needs one.
  const pathname = usePathname();
  const currentHref = activeHref ?? pathname;
  // Grillz, category, product, and bag pages all use the back-button navbar
  // variant (per the real screenshots/explicit confirmation the user gave
  // for each — same treatment every time, not a one-off) — back button in
  // place of the normal empty first grid cell, desktop nav links hidden,
  // and the mobile drawer skipping Home/Shop. Admin pages aren't included;
  // no evidence yet that they want the same treatment.
  const showBackButton =
    pathname === "/grillz" ||
    pathname === "/bag" ||
    pathname.startsWith("/category/") ||
    pathname.startsWith("/product/");
  // Grillz's top hero image bleed is specific to that one page, not shared by
  // every back-button route — category pages don't have an equivalent image.
  const isGrillz = pathname === "/grillz";

  return (
    <>
      {/* NavBar always renders before <main> in StorefrontLayout, so page
          content can never actually appear above it — Grillz's top hero image
          needs to, per the user, so it's rendered here instead, prepended
          before <nav>, only on that route. See GrillzTopBleedImage's own
          comment for why. */}
      {isGrillz && <GrillzTopBleedImage />}
      {/* `viewTransitionName` lives here, not on the wrapping div in
          StorefrontLayout — MobileNavDrawer/SearchOverlay below are this
          component's siblings-in-a-fragment, and a `view-transition-name`
          ancestor becomes a containing block for their `position: fixed`
          overlays, confining them to whatever box carries the name instead
          of the full viewport. Scoping the name to just <nav> keeps the
          page-transition anchoring while leaving the overlays alone. */}
      <nav className={className} style={{ viewTransitionName: "site-header" }}>
        {/* Desktop */}
        <div className="hidden md:grid md:grid-cols-3 md:items-center">
          <div className="justify-self-start">{showBackButton && <BackButton />}</div>
          <div className="flex flex-col items-center justify-self-center gap-(--space-6)">
            <Link href="/" aria-label="Plug Geo home" transitionTypes={["nav-back"]}>
              <Image
                src="/logo.png"
                alt="Plug Geo"
                width={186}
                height={108}
                className="h-auto w-35"
                priority
              />
            </Link>
            {/* Nav links hidden on back-button routes — the back button is
                the way out there, per the user, not an addition alongside
                links. */}
            {!showBackButton && (
              <div className="flex items-center gap-(--space-8)">
                {links.map((link) => {
                  const isActive = link.href === currentHref;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      transitionTypes={[link.href === "/" ? "nav-back" : "nav-forward"]}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "text-h1 font-heading font-bold",
                        isActive ? "text-brand-primary" : "text-text-secondary"
                      )}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex items-center justify-end justify-self-end gap-(--space-7)">
            <button type="button" aria-label="Search" onClick={() => setSearchOpen(true)}>
              <Icon
                icon={Search01Icon}
                size={24}
                strokeWidth={1.75}
                className="text-brand-primary"
              />
            </button>
            <Link
              href="/bag"
              aria-label="Basket"
              transitionTypes={["nav-forward"]}
              className="relative inline-flex"
              ref={(el) => registerTarget("desktopBag", el)}
            >
              <Icon
                icon={ShoppingBasket01Icon}
                size={24}
                strokeWidth={1.75}
                className="text-brand-primary"
              />
              {basketCount != null && basketCount > 0 && (
                <span
                  data-bag-badge
                  className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-brand-primary font-sans text-[10px] leading-none font-bold text-white"
                >
                  {basketCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile */}
        <div className="grid grid-cols-3 items-center md:hidden">
          <div className="justify-self-start">{showBackButton && <BackButton className="size-12" />}</div>
          <Link
            href="/"
            aria-label="Plug Geo home"
            transitionTypes={["nav-back"]}
            className="justify-self-center"
          >
            <Image
              src="/logo.png"
              alt="Plug Geo"
              width={186}
              height={108}
              className="h-auto w-28"
              priority
            />
          </Link>
          {/* Hamburger stays visible on Grillz too, alongside the back
              button — per the user, it just opens a drawer without the
              Home/Shop links there (see the links prop passed below). */}
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
            className="flex size-12 items-center justify-center justify-self-end"
            ref={(el) => registerTarget("mobileMenu", el)}
          >
            <Icon icon={Menu03Icon} size={28} className="text-brand-primary" />
          </button>
        </div>
      </nav>

      <MobileNavDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        // Back-button routes' drawer skips Home/Shop entirely — search/basket
        // only, per the user — rather than teaching MobileNavDrawer a
        // route-specific flag, an empty links array already renders nothing
        // for that block.
        links={showBackButton ? [] : links}
        activeHref={currentHref}
        basketCount={basketCount}
        onSearchClick={() => {
          setDrawerOpen(false);
          setSearchOpen(true);
        }}
      />

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
