"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { DURATION, EASE, MOTION_QUERY } from "@/lib/motion";

// Small state-change confirmation for two-or-more-way toggles (SortToggle,
// LayoutToggle): whenever the active option changes, that option's button
// gets a quick snappy scale-punch — reads as a deliberate selection, not
// just the existing CSS color fade. Not viewport-gated (interaction-
// triggered, always-run, like the dial wave/add-to-bag). Skips the very
// first render so mounting with an initial value doesn't pulse.
//
// `setButtonRef(key)` returns a stable-enough ref callback per option key —
// callers pass whichever primitive identifies each button (e.g. "asc"/"desc").

export function useTogglePulse<T extends string>(active: T) {
  const elsRef = useRef<Partial<Record<T, HTMLElement | null>>>({});
  const isFirstRender = useRef(true);

  useLayoutEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const el = elsRef.current[active];
    if (!el) return;

    const mm = gsap.matchMedia();
    mm.add(MOTION_QUERY.full, () => {
      const tween = gsap.fromTo(
        el,
        { scale: 0.82 },
        { scale: 1, duration: DURATION.micro, ease: EASE.snappyBack }
      );
      return () => tween.kill();
    });
    return () => mm.revert();
  }, [active]);

  return (key: T) => (el: HTMLElement | null) => {
    elsRef.current[key] = el;
  };
}
