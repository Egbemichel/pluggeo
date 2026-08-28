"use client";

import { useCallback, useEffect, useRef } from "react";
import gsap from "gsap";
import { EASE, DURATION, STAGGER, MOTION_QUERY } from "@/lib/motion";

// The one shared dial interaction, per the user — CategoryDial and
// PaginationDial both consume this internally, so every existing render
// site (celebrity showcase x2, shop sidebar, category page x2, shop page
// x2) inherits it automatically with zero per-site changes.
//
// Pointer Events (not separate mouse/touch handlers) covers desktop hover
// and mobile swipe with one code path — `pointerType` tells them apart only
// where the spec actually distinguishes: touch selects on release, mouse
// does not (click-to-select is untouched, this is a pure hover embellishment
// layered on top of it).
//
// The "stadium wave" is GSAP's own `stagger: { from: <index> }` — it already
// computes each element's delay by distance from that index in both
// directions, which *is* a ripple emanating from wherever the pointer
// currently is. No hand-rolled propagation math needed.
//
// Interruption handling: every new trigger calls `gsap.killTweensOf` +
// `overwrite: "auto"` before starting the next wave, so a wave re-triggered
// mid-flight restarts cleanly from wherever it currently is — it never
// queues, glitches, or jumps. `pointercancel`/`pointerleave` always resolves
// every item back to rest, so an interrupted gesture (e.g. the OS stealing
// the touch for a system swipe) still settles into a valid end state.

export type UseDialWaveOptions = {
  /** Fires on pointerup for a touch gesture, with whichever item's center
   * was nearest the release point — this is what "the wave follows the
   * swipe, whichever item the thumb lands on becomes selected" means. */
  onSelectAtRelease?: (index: number) => void;
  peakScale?: number;
  ease?: string;
  duration?: number;
};

export function useDialWave({
  onSelectAtRelease,
  peakScale = 1.12,
  ease = EASE.snappy,
  duration = DURATION.micro,
}: UseDialWaveOptions) {
  const itemEls = useRef<(HTMLElement | null)[]>([]);
  const lastIndex = useRef<number | null>(null);
  const isPointerDown = useRef(false);
  const rafId = useRef<number | null>(null);
  const reducedMotion = useRef(false);

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION_QUERY.reduced, () => {
      reducedMotion.current = true;
      return () => {
        reducedMotion.current = false;
      };
    });
    return () => mm.revert();
  }, []);

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

  const settle = useCallback(() => {
    const els = itemEls.current.filter((el): el is HTMLElement => el !== null);
    gsap.killTweensOf(els);
    gsap.to(els, { scale: 1, duration, overwrite: "auto" });
    lastIndex.current = null;
  }, [duration]);

  const triggerWaveAt = useCallback(
    (x: number, y: number) => {
      if (reducedMotion.current) return;
      const nearest = nearestIndexToPoint(x, y);
      if (nearest === lastIndex.current) return;
      lastIndex.current = nearest;

      const els = itemEls.current.filter((el): el is HTMLElement => el !== null);
      gsap.killTweensOf(els);
      gsap.to(els, {
        scale: peakScale,
        duration,
        ease,
        yoyo: true,
        repeat: 1,
        overwrite: "auto",
        stagger: { each: STAGGER.dialWave, from: nearest },
      });
    },
    [nearestIndexToPoint, peakScale, duration, ease]
  );

  const scheduleWave = useCallback(
    (x: number, y: number) => {
      if (rafId.current != null) return;
      rafId.current = requestAnimationFrame(() => {
        rafId.current = null;
        triggerWaveAt(x, y);
      });
    },
    [triggerWaveAt]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType === "touch" && !isPointerDown.current) return;
      scheduleWave(e.clientX, e.clientY);
    },
    [scheduleWave]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      isPointerDown.current = true;
      if (e.pointerType === "touch") scheduleWave(e.clientX, e.clientY);
    },
    [scheduleWave]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      isPointerDown.current = false;
      if (e.pointerType === "touch") {
        const nearest = nearestIndexToPoint(e.clientX, e.clientY);
        onSelectAtRelease?.(nearest);
      }
      settle();
    },
    [nearestIndexToPoint, onSelectAtRelease, settle]
  );

  const onPointerLeaveOrCancel = useCallback(() => {
    isPointerDown.current = false;
    settle();
  }, [settle]);

  useEffect(() => {
    return () => {
      if (rafId.current != null) cancelAnimationFrame(rafId.current);
    };
  }, []);

  return {
    itemRef,
    containerProps: {
      onPointerMove,
      onPointerDown,
      onPointerUp,
      onPointerCancel: onPointerLeaveOrCancel,
      onPointerLeave: onPointerLeaveOrCancel,
    },
  };
}
