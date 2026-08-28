"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { DURATION, EASE, MOTION_QUERY } from "@/lib/motion";

// Shared open/close accordion mechanic — first consumed by ProductCustomize's
// "Customize" disclosure, later reused by PriceFilterPanel's "Custom price"
// disclosure (same visual pattern, per the user). Unlike use-drawer-transition
// (which unmounts on close and slides the whole panel), an accordion's content
// stays mounted the whole time and is measured/animated by height so it can
// smoothly grow to its natural content height rather than a hardcoded value —
// callers must always render the content, never `{open && <div>...}` it, or
// there's nothing here to measure/animate.

export function useAccordion<T extends HTMLElement>(open: boolean) {
  const contentRef = useRef<T | null>(null);
  const isFirstRender = useRef(true);

  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      gsap.set(el, {
        height: open ? "auto" : 0,
        opacity: open ? 1 : 0,
        overflow: "hidden",
      });
      return;
    }

    const mm = gsap.matchMedia();

    mm.add(MOTION_QUERY.full, () => {
      if (open) {
        const targetHeight = el.scrollHeight;
        const tween = gsap.fromTo(
          el,
          { height: 0, opacity: 0 },
          {
            height: targetHeight,
            opacity: 1,
            duration: DURATION.drawer,
            ease: EASE.drawerOpen,
            onComplete: () => gsap.set(el, { height: "auto" }),
          }
        );
        return () => tween.kill();
      }
      const tween = gsap.to(el, {
        height: 0,
        opacity: 0,
        duration: DURATION.drawer * 0.8,
        ease: EASE.drawerClose,
      });
      return () => tween.kill();
    });

    mm.add(MOTION_QUERY.reduced, () => {
      gsap.set(el, { height: open ? "auto" : 0, opacity: open ? 1 : 0 });
      return () => {};
    });

    return () => mm.revert();
  }, [open]);

  return contentRef;
}
