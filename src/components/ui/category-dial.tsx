"use client";

import { useLayoutEffect, useRef, useState } from "react";
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
//
// 2026-08-29: a fixed OFFSET_X_STEP (46px) badly broke click accuracy once real
// celebrity handles were wired in — labels vary from "@rodwave" (~90px) to
// "@trappyoblockouttt365" (~180px+), so a 46px step meant a closer-to-center
// item's wide, higher-z-index pill covered most (or all but an ~18px sliver) of
// the pill one step further out. Confirmed via `document.elementFromPoint` at a
// visually-distinct pill's own center resolving to a *different* pill — clicking
// where "@rodwave" was clearly drawn actually selected "@moneybaggyo" underneath
// it, which is what read as "jumpy"/"can only reach the first and last": most of
// the strip's real click area belonged to whichever neighbor happened to be
// closer to center, not the item under the pointer. This was a second,
// independent cause layered on top of the wave/no-transition issues already
// fixed in the entry above — removing the wave alone didn't touch it. Fixed by
// measuring each pill's real rendered width (`useLayoutEffect`, re-measured
// after every render since size changes with distance from active) and laying
// items out from a per-pair overlap budget (`PEEK_OVERLAP`) instead of a fixed
// step, so however wide two neighboring labels are, at most ~35% of their
// combined width overlaps — enough to keep the coverflow's intentional
// peeking-behind look while guaranteeing the visually topmost pill at any point
// is also the one that's actually clickable there.
const PEEK_OVERLAP = 0.35;

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

  // Real per-item widths, measured post-render — see the file comment above
  // PEEK_OVERLAP for why a fixed px step doesn't work with variable-width
  // labels. Re-measures after every render (no deps array) since distance
  // from `activeIndex` — and therefore each pill's font-size/padding/width —
  // changes on every selection; guarded so `setWidths` only fires when a
  // measured value actually changed, avoiding a render loop.
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [widths, setWidths] = useState<number[]>([]);

  // Deliberately no deps array: must re-measure after every render
  // (activeIndex/items drive font-size/padding/width via inline styles read
  // through refs, not values this effect can usefully list), guarded above
  // by skipping setWidths when nothing actually changed so it can't loop.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (!isHorizontal) return;
    const measured = items.map((_, i) => buttonRefs.current[i]?.offsetWidth ?? 0);
    setWidths((prev) => {
      if (prev.length === measured.length && prev.every((w, i) => w === measured[i])) {
        return prev;
      }
      return measured;
    });
  });

  const setButtonRef = (index: number) => (el: HTMLButtonElement | null) => {
    buttonRefs.current[index] = el;
    itemRef(index)(el);
  };

  // Falls back to the old fixed step for the one render before widths are
  // measured (never visible — useLayoutEffect's setWidths re-renders
  // synchronously before paint) and if an item has no measured width yet.
  const offsetForIndex = (index: number): number => {
    if (widths.length !== items.length) return (index - activeIndex) * OFFSET_X_STEP;
    const offsets = new Array(items.length).fill(0);
    for (let i = activeIndex + 1; i < items.length; i++) {
      const gap = ((widths[i - 1] || OFFSET_X_STEP) + (widths[i] || OFFSET_X_STEP)) / 2;
      offsets[i] = offsets[i - 1] + gap * (1 - PEEK_OVERLAP);
    }
    for (let i = activeIndex - 1; i >= 0; i--) {
      const gap = ((widths[i + 1] || OFFSET_X_STEP) + (widths[i] || OFFSET_X_STEP)) / 2;
      offsets[i] = offsets[i + 1] - gap * (1 - PEEK_OVERLAP);
    }
    return offsets[index];
  };

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
              ref={setButtonRef(index)}
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
                transform: `translate(-50%, -50%) translateX(${offsetForIndex(index)}px)`,
              }}
              className="flex shrink-0 items-center justify-center border border-black bg-white font-heading leading-[1.4] font-bold text-text-primary transition-[filter,transform,height,font-size,padding,border-radius] duration-300 ease-out"
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
            className="flex shrink-0 items-center justify-center border border-black bg-white font-heading leading-[1.4] font-bold text-text-primary transition-[filter,height,font-size,padding,border-radius] duration-300 ease-out"
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
