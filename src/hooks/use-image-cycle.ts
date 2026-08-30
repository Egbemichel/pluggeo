"use client";

import { useEffect, useRef, useState } from "react";
import { MOTION_QUERY } from "@/lib/motion";

// Auto-advances through a product's photos on a loop, per the user: seeing
// the dot Indicator show 4 images on a product card with no way to actually
// see them (short of opening the PDP) read as pointless. Only cycles while
// the card is actually on-screen (a real IntersectionObserver, not
// useViewportEnter's "fire once and forget" semantics — this needs genuine
// pause-on-exit/resume-on-re-entry, not a one-shot entrance trigger), so a
// grid of many product cards isn't running dozens of intervals for cards
// the visitor has already scrolled past. Respects `prefers-reduced-motion`
// by simply never starting — an unrequested auto-advancing carousel is a
// well-known motion-sensitivity complaint, and there's nothing lost by
// staying on the first photo (that's already the deliberate "cover" shot).

const DEFAULT_INTERVAL_MS = 2200;

export function useImageCycle<T extends HTMLElement>(count: number, intervalMs = DEFAULT_INTERVAL_MS) {
  const ref = useRef<T | null>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (count <= 1) return;
    if (window.matchMedia(MOTION_QUERY.reduced).matches) return;

    const el = ref.current;
    if (!el) return;

    let intervalId: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (intervalId != null) return;
      intervalId = setInterval(() => setIndex((i) => (i + 1) % count), intervalMs);
    };
    const stop = () => {
      if (intervalId != null) clearInterval(intervalId);
      intervalId = null;
    };

    const observer = new IntersectionObserver(
      ([entry]) => (entry?.isIntersecting ? start() : stop()),
      { threshold: 0.3 }
    );
    observer.observe(el);

    return () => {
      stop();
      observer.disconnect();
    };
  }, [count, intervalMs]);

  return [ref, count > 1 ? index : 0] as const;
}
