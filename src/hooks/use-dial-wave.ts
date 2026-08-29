"use client";

import { useCallback, useRef } from "react";

// Shared dial pointer-tracking, per the user — CategoryDial and
// PaginationDial both consume this internally, so every existing render
// site (celebrity showcase x2, shop sidebar, category page x2, shop page
// x2) inherits it automatically with zero per-site changes.
//
// 2026-08-29: the "stadium wave" scale animation this used to drive was
// removed entirely, per the user — it re-triggered a `gsap.to(scale, ...)`
// on nearly every pointermove frame, fighting for the same elements'
// `transform` while the coverflow's own click-driven resize (height/
// font-size/padding, now smoothed via a plain CSS transition — see
// CategoryDial/PaginationDial) was *also* changing their layout size at the
// same time. Two independent, uncoordinated size-changing effects on the
// same buttons is what made the dials read as jumpy and hard to control,
// especially on longer lists (e.g. the 8 celebrity handles) where most
// items already collapse to the same minimum coverflow size (see
// lib/coverflow.ts) and have little room to also absorb a scale wave on
// top of that. What's left here is purely functional, not decorative:
// pointer tracking so a touch swipe-and-release still selects whichever
// item the thumb lands on (`onSelectAtRelease`) — click-to-select (mouse or
// tap) was always handled by the buttons' own onClick and never depended on
// this hook. Visual feedback for hover/selection now comes entirely from
// the coverflow's own size/blur response to `activeId` plus the app-wide
// global hover-fade rule in globals.css — both already existed independent
// of the wave, so removing it doesn't leave a feedback gap.

export type UseDialWaveOptions = {
  /** Fires on pointerup for a touch gesture, with whichever item's center
   * was nearest the release point — this is what "swipe across the dial,
   * whichever item the thumb lands on becomes selected" means. */
  onSelectAtRelease?: (index: number) => void;
};

export function useDialWave({ onSelectAtRelease }: UseDialWaveOptions) {
  const itemEls = useRef<(HTMLElement | null)[]>([]);

  const itemRef = useCallback(
    (index: number) => (el: HTMLElement | null) => {
      itemEls.current[index] = el;
    },
    []
  );

  const nearestIndexToPoint = useCallback((x: number, y: number) => {
    let nearest = 0;
    let nearestDist = Infinity;
    itemEls.current.forEach((el, i) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dist = (cx - x) ** 2 + (cy - y) ** 2;
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    });
    return nearest;
  }, []);

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType === "touch") {
        const nearest = nearestIndexToPoint(e.clientX, e.clientY);
        onSelectAtRelease?.(nearest);
      }
    },
    [nearestIndexToPoint, onSelectAtRelease]
  );

  return {
    itemRef,
    containerProps: {
      onPointerUp,
    },
  };
}
