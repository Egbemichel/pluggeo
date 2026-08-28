"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

// Low-level viewport-gate primitive — every scroll-triggered entrance in the
// app builds on this; nothing else touches IntersectionObserver directly.
// `once` (default true) unobserves immediately on first crossing, which is
// what makes an entrance "run once per page load, not on re-scroll": Next's
// App Router unmounts/remounts a route's own tree on real navigation, so a
// fresh component mount already IS a fresh "page load" boundary — no extra
// sessionStorage/ref bookkeeping needed to get that guarantee.
//
// `onEnter` may return a cleanup function (e.g. `() => tween.kill()`) —
// it's called both when the observer disconnects on unmount (safe mid-tween:
// GSAP tweens can be killed at any point in their lifecycle) and, for
// `once: false` callers, right before the next re-entry fires.

export type UseViewportEnterOptions = {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
};

export function useViewportEnter<T extends HTMLElement>(
  onEnter: (element: T) => (() => void) | void,
  { threshold = 0.2, rootMargin = "0px 0px -10% 0px", once = true }: UseViewportEnterOptions = {}
) {
  const ref = useRef<T | null>(null);
  const onEnterRef = useRef(onEnter);
  // Kept current via a layout effect (not a write during render) — this
  // hook's lint config flags ref writes during render even for the
  // classic "always latest callback" pattern.
  useLayoutEffect(() => {
    onEnterRef.current = onEnter;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let cleanup: (() => void) | void;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        cleanup?.();
        cleanup = onEnterRef.current(el);
        if (once) observer.unobserve(el);
      },
      { threshold, rootMargin }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      cleanup?.();
    };
  }, [threshold, rootMargin, once]);

  return ref;
}
