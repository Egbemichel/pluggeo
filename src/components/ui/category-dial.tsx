"use client";

import {
  coverflowBlurForDistance,
  coverflowRadiusForDistance,
  coverflowSizeForDistance,
} from "@/lib/coverflow";
import { useDialWave } from "@/hooks/use-dial-wave";
import { cn } from "@/lib/utils";

// Built from the real Figma node (557:4412, "shopCategoryDial") — same coverflow
// mechanic as PaginationDial (shares lib/coverflow.ts), sized to fit text labels
// instead of a fixed square. Font-size and height scale together (measured ratio:
// fontSize ≈ 0.55 × the coverflow size). `orientation` added for the "Worn by your
// favorite celebs" section's mobile layout (horizontal row of @handles) — same
// component, not a duplicate, since the underlying picker (arbitrary-width text,
// distance-scaled) is identical, just laid out differently.
//
// No forced text-transform: earlier this hardcoded `capitalize` (fine for category
// names), but that breaks "@handle"-style labels — callers own their labels' casing.
//
// 2026-08-27: horizontal orientation had no width constraint or overflow handling
// — with 7 celebrity handles at their natural (unshrunk, `shrink-0`) widths, the
// row was ~1475px wide on a 375px viewport and simply overflowed the entire page,
// forcing horizontal page scroll (confirmed via a real browser check, not just a
// screenshot). Wrapped in its own `overflow-x-auto` strip so it scrolls within
// itself instead (the user confirmed scroll/swipe *within* the dial is the
// intended interaction, not something to eliminate).
//
// 2026-08-27, horizontal orientation redesigned twice against user feedback:
// attempt 1 just let the row overflow the whole page (~1475px on a 375px
// viewport, confirmed via a real browser check) — wrapped it in its own
// `overflow-x-auto` strip. Attempt 2 misread "arc on the z-axis" as a literal 2D
// curve (translateY droop + rotate) — user corrected: they meant an actual
// depth-stacked coverflow, active item centered and frontmost at full size, each
// neighbor further out sitting *behind* the one closer to center (overlapping,
// lower z-index), shrinking and blurring with distance, with only the near half
// of items 2+ steps out visible before they're occluded/clipped. Implemented
// as absolutely-positioned items centered in a fixed-height strip, offset by a
// fixed step × signed distance, z-index descending with distance, clipped by
// the strip's own `overflow-hidden` — not a scrolling list anymore, matches a
// physical rolodex/coverflow rather than a chip row.
//
// HORIZONTAL_SCALE: the base coverflowSizeForDistance values (106/97/89/73) were
// measured off the desktop "shopCategoryDial" node, where each pill has a whole
// column to itself — at full size the *active* pill's font (58px) alone was
// nearly the full mobile card width. Scaled down so the stack actually reads as
// several distinct items rather than one oversized chip.

export type CategoryDialItem = { id: string; label: string };

export type CategoryDialProps = {
  items: CategoryDialItem[];
  activeId: string;
  onActiveChange: (id: string) => void;
  orientation?: "vertical" | "horizontal";
  className?: string;
};

export function CategoryDial({
  items,
  activeId,
  onActiveChange,
  orientation = "vertical",
  className,
}: CategoryDialProps) {
  const activeIndex = items.findIndex((item) => item.id === activeId);
  const isHorizontal = orientation === "horizontal";
  const HORIZONTAL_SCALE = 0.45;
  const OFFSET_X_STEP = 46; // px each step shifts left/right from dead center
  const STRIP_HEIGHT = coverflowSizeForDistance(0) * HORIZONTAL_SCALE + 16;

  // The one shared dial-wave interaction (see its own file for the "stadium
  // wave" mechanics) — hover on desktop, swipe-and-release on mobile.
  // Click-to-select is untouched; this is a hover/swipe embellishment layered
  // on top of it. Applies identically to both orientations below.
  const { itemRef, containerProps } = useDialWave({
    onSelectAtRelease: (index) => {
      const item = items[index];
      if (item) onActiveChange(item.id);
    },
  });

  if (isHorizontal) {
    return (
      <div
        className={cn("relative w-full overflow-hidden", className)}
        style={{ height: STRIP_HEIGHT }}
        {...containerProps}
      >
        {items.map((item, index) => {
          const signedDistance = index - activeIndex;
          const distance = Math.abs(signedDistance);
          const size = coverflowSizeForDistance(distance) * HORIZONTAL_SCALE;

          return (
            <button
              key={item.id}
              ref={itemRef(index)}
              type="button"
              aria-current={distance === 0 ? "true" : undefined}
              onClick={() => onActiveChange(item.id)}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                height: size,
                borderRadius: coverflowRadiusForDistance(distance) * HORIZONTAL_SCALE,
                fontSize: size * 0.55,
                paddingLeft: size * 0.25,
                paddingRight: size * 0.25,
                filter: coverflowBlurForDistance(distance),
                zIndex: 100 - distance,
                transform: `translate(-50%, -50%) translateX(${signedDistance * OFFSET_X_STEP}px)`,
              }}
              className="flex shrink-0 items-center justify-center border border-black bg-white font-heading leading-[1.4] font-bold text-text-primary transition-[filter,transform]"
            >
              {item.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center gap-(--space-2)", className)} {...containerProps}>
      {items.map((item, index) => {
        const distance = Math.abs(index - activeIndex);
        const size = coverflowSizeForDistance(distance);

        return (
          <button
            key={item.id}
            ref={itemRef(index)}
            type="button"
            aria-current={distance === 0 ? "true" : undefined}
            onClick={() => onActiveChange(item.id)}
            style={{
              height: size,
              borderRadius: coverflowRadiusForDistance(distance),
              fontSize: size * 0.55,
              paddingLeft: size * 0.25,
              paddingRight: size * 0.25,
              filter: coverflowBlurForDistance(distance),
            }}
            className="flex shrink-0 items-center justify-center border border-black bg-white font-heading leading-[1.4] font-bold text-text-primary transition-[filter]"
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
