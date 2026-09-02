"use client";

import { useLayoutEffect, useRef, useState, useSyncExternalStore, type TouchEvent } from "react";
import Link from "next/link";
import { BadgeInfoIcon, FullScreenIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/icon";
import { Indicator } from "@/components/ui/indicator";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { MediaFrame } from "@/components/ui/media-tile";
import { Pill } from "@/components/ui/pill";
import { AddToBagButton } from "@/components/ui/add-to-bag-button";
import { SectionCarouselNav } from "@/components/section-header";
import { coverflowBlurForDistance } from "@/lib/coverflow";
import { currency } from "@/components/product-card";
import { cn } from "@/lib/utils";
import type { MediaItem } from "@/lib/media";

// Built from the real Figma node (596:600, "imageGallery") sitting above the
// repeated list rows — ProductList's own file comment already pointed at this
// node but it was never actually built. Per the user: when the Shop page's
// layout switches to list/gallery, `products[0]` auto-selects into this
// section — a coverflow of *that one product's* photos (prev/next neighbors
// smaller and blurred, active one big/sharp/centered, matching the same
// distance-based blur `lib/coverflow.ts` already uses for CategoryDial), a dot
// Indicator so the viewer can tell how many photos exist and which one they're
// on, chevrons to page through them on desktop, and a swipe gesture (plain
// touch-delta threshold, no library) doing the same on mobile. Only immediate
// neighbors (distance ≤ 1) are rendered as tiles regardless of how many photos
// the product actually has — matches the exact 3-tile look in the reference
// screenshot; the Indicator (not the tile row) is what conveys the true total
// count and position, per the user's own note about it. The soft dark blob
// under each tile approximates the drop-shadow visible in the reference
// photos (real product photography does this in-camera; there's nothing to
// fake for the flat placeholder SVG beyond a generic shadow shape).

export type SpotlightProduct = {
  href: string;
  /** Always a real image, never a video — used for the add-to-bag flight
   * thumbnail, which can't render video. See `lib/products.ts`'s
   * `coverImageFor`. */
  image: { src: string; alt: string };
  images: MediaItem[];
  category: string;
  title: string;
  price: number;
  compareAtPrice?: number;
  isFromPrice?: boolean;
};

// Base sizes read "sooo small" per the user — bumped 3x on mobile, 4x on
// desktop (the `md` breakpoint, matching the site's other mobile/desktop
// splits) rather than one fixed value for both. Detected via matchMedia
// (not CSS alone) since these feed real pixel math — the tile width/height
// and the translateX offset between tiles both need one concrete number in
// sync, which a CSS media query can't hand back to JS.
const BASE_ACTIVE_SIZE = 200;
const BASE_NEIGHBOR_SIZE = 110;
const BASE_OFFSET_X_STEP = 110;
const MOBILE_SCALE = 3;
const DESKTOP_SCALE = 4;
const SWIPE_THRESHOLD_PX = 40;

// `useSyncExternalStore` (not useEffect+useState) for subscribing to
// matchMedia — the officially-recommended pattern for reading external
// browser state like this in React, since it hands back an SSR-safe
// snapshot (`getServerSnapshot`) without needing a post-mount effect that
// would otherwise call setState synchronously in its own body.
function subscribeToDesktopQuery(callback: () => void) {
  const mq = window.matchMedia("(min-width: 48rem)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}
function getIsDesktop() {
  return window.matchMedia("(min-width: 48rem)").matches;
}
function getIsDesktopServerSnapshot() {
  return false;
}

// Same pattern for viewport height — needed because ProductSpotlight is
// `sticky` (see the Shop page's own comment on why). At the literal 3x/4x
// request, the coverflow alone measured ~930px tall in testing, tall enough
// that the pinned spotlight completely covered the product list rows below
// it — confirmed via `elementFromPoint` at a row's own center resolving to
// one of the spotlight's own `<img>` elements, not the row, meaning those
// rows were genuinely unclickable/unhoverable, not just visually crowded.
// Capping active size against viewport height (alongside the width cap
// above) keeps the sticky block from ever growing tall enough to swallow
// the thing it's supposed to sit above.
function subscribeToViewportHeight(callback: () => void) {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
}
function getViewportHeight() {
  return window.innerHeight;
}
function getViewportHeightServerSnapshot() {
  return 0;
}

export type ProductSpotlightProps = {
  product: SpotlightProduct;
  className?: string;
};

export function ProductSpotlight({ product, className }: ProductSpotlightProps) {
  const [index, setIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const isDesktop = useSyncExternalStore(
    subscribeToDesktopQuery,
    getIsDesktop,
    getIsDesktopServerSnapshot
  );
  const viewportHeight = useSyncExternalStore(
    subscribeToViewportHeight,
    getViewportHeight,
    getViewportHeightServerSnapshot
  );
  const touchStartX = useRef<number | null>(null);
  const coverflowRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useLayoutEffect(() => {
    const el = coverflowRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width != null) setContainerWidth(width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const scale = isDesktop ? DESKTOP_SCALE : MOBILE_SCALE;
  const desiredActiveSize = BASE_ACTIVE_SIZE * scale;
  // The active tile plus one neighbor peeking past it on each side needs
  // roughly the active tile's own width, plus some fraction of it, to clear
  // the container (neighbor width + part of its own width beyond that, on
  // both sides — see the file comment above `BASE_ACTIVE_SIZE`) — measured
  // live via ResizeObserver rather than a fixed breakpoint value, since the
  // 3x/4x request genuinely doesn't fit a real mobile viewport at all
  // (confirmed via a real overflow measurement: 316px of horizontal
  // page-scroll at 375px wide, uncapped) and the desktop column's own width
  // varies with the sidebar. `containerWidth || Infinity` skips clamping
  // only before the very first measurement lands, not as a permanent escape
  // hatch.
  //
  // Divisor tightened from 1.65 to 1.35 (2026-08-30, per the user asking
  // for "full image sizes" here) — this is almost always the *actual*
  // binding constraint on mobile (a ~320-375px-wide container divided by
  // 1.65 landed around 190-225px, well under the 600px desired size, while
  // the height budget below barely mattered there), so it's the real lever
  // for "bigger" on the viewport this was most cramped on. Neighbors still
  // peek, just less generously, since some peek is the coverflow's whole
  // visual point.
  const maxActiveSizeFromWidth = (containerWidth || Infinity) / 1.35;
  // Budgets the whole sticky block (image + nav row + Indicator + price/CTA
  // row, ~300px measured at a 900px-tall viewport, rounded up for margin)
  // against a target fraction of the viewport, rather than capping the
  // image alone — capping the image alone still let the *total* sticky
  // height reach ~930px at the literal 4x request, which is tall enough to
  // fully cover the product list rows beneath it (confirmed via
  // `elementFromPoint` resolving to the spotlight's own elements, not the
  // list, at a row's own center — those rows were genuinely unclickable,
  // not just visually crowded).
  //
  // Budget loosened from 70% to 80% of viewport height (2026-08-30, same
  // "full image sizes" request) — still leaves a real, if narrower,
  // consistently-visible strip of the list below at any scroll position,
  // rather than removing this safety margin outright and risking the exact
  // "list becomes unclickable" regression this cap was added to fix.
  const ESTIMATED_CHROME_HEIGHT = 300;
  const IMAGE_WRAPPER_PADDING = 24;
  const maxTotalStickyHeight = (viewportHeight || Infinity) * 0.8;
  const maxActiveSizeFromHeight =
    maxTotalStickyHeight - ESTIMATED_CHROME_HEIGHT - IMAGE_WRAPPER_PADDING;
  const activeSize = Math.min(desiredActiveSize, maxActiveSizeFromWidth, maxActiveSizeFromHeight);
  const sizeRatio = activeSize / BASE_ACTIVE_SIZE;
  const neighborSize = BASE_NEIGHBOR_SIZE * sizeRatio;
  const offsetXStep = BASE_OFFSET_X_STEP * sizeRatio;

  const canGoPrev = index > 0;
  const canGoNext = index < product.images.length - 1;
  const goPrev = () => canGoPrev && setIndex((i) => i - 1);
  const goNext = () => canGoNext && setIndex((i) => i + 1);

  const onTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: TouchEvent) => {
    if (touchStartX.current == null) return;
    const delta = (e.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
    if (delta > SWIPE_THRESHOLD_PX) goPrev();
    else if (delta < -SWIPE_THRESHOLD_PX) goNext();
    touchStartX.current = null;
  };

  const onSale = product.compareAtPrice != null && product.compareAtPrice > product.price;

  return (
    <div className={cn("flex w-full flex-col gap-(--space-6)", className)}>
      <SectionCarouselNav
        onPrev={canGoPrev ? goPrev : undefined}
        onNext={canGoNext ? goNext : undefined}
        className="hidden self-end md:flex"
      />

      <div
        ref={coverflowRef}
        className="relative flex items-center justify-center"
        style={{ height: activeSize + 24 }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {product.images.map((image, i) => {
          const distance = Math.abs(i - index);
          if (distance > 1) return null;
          const isActive = distance === 0;
          const size = isActive ? activeSize : neighborSize;

          return (
            <div
              key={i}
              className="absolute top-1/2 left-1/2 flex flex-col items-center transition-[filter,transform,width,height] duration-500 ease-out"
              style={{
                width: size,
                height: size,
                transform: `translate(-50%, -50%) translateX(${(i - index) * offsetXStep}px)`,
                filter: coverflowBlurForDistance(distance),
                zIndex: 10 - distance,
              }}
            >
              {/* Only the active tile opens the lightbox — neighbor tiles
                  have no click behavior at all today (selecting one only
                  happens via swipe or the prev/next chevrons), so giving
                  them a "view larger" click too would be a new, separate
                  interaction this pass didn't ask for. A video active tile
                  gets real play/pause + mute/unmute controls (2026-08-30,
                  per the user) instead of the lightbox button — those can't
                  share a click target with a button that also opens the
                  lightbox, so it gets its own explicit fullscreen button
                  instead, same pattern as ImageThumbnail's PDP gallery. */}
              {isActive && image.type === "video" ? (
                <div className="relative h-full w-full">
                  <MediaFrame key={image.src} media={image} className="object-contain" controls active />
                  <button
                    type="button"
                    aria-label="View larger"
                    onClick={() => setLightboxIndex(i)}
                    className="absolute top-1 right-1 flex size-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm"
                  >
                    <Icon icon={FullScreenIcon} size={16} />
                  </button>
                </div>
              ) : isActive ? (
                <button
                  type="button"
                  aria-label="View larger image"
                  onClick={() => setLightboxIndex(i)}
                  className="relative h-full w-full"
                >
                  <MediaFrame media={image} className="object-contain" />
                </button>
              ) : (
                <div className="relative h-full w-full">
                  <MediaFrame media={image} className="object-contain" active={false} />
                </div>
              )}
              <div className="mt-(--space-2) h-3 w-3/4 rounded-full bg-black/20 blur-md" />
            </div>
          );
        })}
      </div>

      <ImageLightbox
        images={product.images}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={(i) => {
          setLightboxIndex(i);
          setIndex(i);
        }}
      />

      <Indicator count={product.images.length} activeIndex={index} className="self-center" />

      {/* justify-between + full width (no self-start): per the user, Details
          and Add-to-bag belong at the far right of the component, not close
          beside the text. */}
      <div className="flex items-stretch justify-between gap-(--space-9)">
        <div className="flex min-w-0 flex-col gap-(--space-3)">
          {onSale && (
            <p className="text-eyebrow font-sans font-light text-text-primary">Sale</p>
          )}
          <h3 className="text-h5 font-heading font-bold text-brand-primary">
            {product.category}
          </h3>
          <span className="text-card-title font-sans font-normal text-text-primary">
            {product.title}
          </span>
          {/* flex-wrap + whitespace-nowrap per piece (same pattern as
              ProductCard's price row): if everything doesn't fit on one
              line, a piece drops to its own line as a whole unit instead
              of forcing an unbreakable minimum width — omitting flex-wrap
              here was exactly what forced the whole page ~30px wider than
              the viewport on mobile (confirmed via a real overflow
              measurement). "From" is its own span, not concatenated into
              the amount's span (2026-09-02, a real report on ProductCard's
              own version of this row — see that file's comment for why a
              single unbreakable "From $1,200.00" string can only overflow
              past its box, never wrap, and ends up visually overlapping
              whatever sits next to it). */}
          <div className="flex flex-wrap items-center gap-(--space-1)">
            {product.isFromPrice && (
              <span className="text-price font-sans font-medium whitespace-nowrap text-text-primary">
                From
              </span>
            )}
            <span className="text-price font-sans font-medium whitespace-nowrap text-text-primary">
              {currency.format(product.price)}
            </span>
            {onSale && (
              <span className="text-price font-sans font-medium whitespace-nowrap text-text-secondary line-through">
                {currency.format(product.compareAtPrice!)}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end justify-between gap-(--space-4)">
          {/* Details is the actual navigation to the product's page — clicking
              a ProductList row below only re-selects which product feeds this
              spotlight, per the user, so this Link is the one real way in. */}
          <Link href={product.href} transitionTypes={["nav-forward"]}>
            <Pill icon={<Icon icon={BadgeInfoIcon} size={24} className="text-brand-primary" />}>
              <span className="text-body-sm font-sans font-light">Details</span>
            </Pill>
          </Link>
          <AddToBagButton
            variant="labeled"
            item={{
              id: product.href,
              href: product.href,
              image: product.image,
              title: product.title,
              category: product.category,
              price: product.price,
              compareAtPrice: product.compareAtPrice,
              isFromPrice: product.isFromPrice,
            }}
          />
        </div>
      </div>
    </div>
  );
}
