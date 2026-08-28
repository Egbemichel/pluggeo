"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { EASE, DURATION, STAGGER, MOTION_QUERY } from "@/lib/motion";

// Shared open/close choreography for MobileNavDrawer and MobileFilterDrawer
// — identical pattern for both, per the user. Replaces the previous
// `if (!open) return null`, which made any exit animation impossible (the
// DOM node was just gone the instant `open` flipped false).
//
// `mounted` lags `open` on close so the panel/items stay in the DOM long
// enough to animate out: opening mounts immediately then plays
// slide-in -> staggered item fade-in (top to bottom); closing plays
// staggered item fade-out (bottom to top) -> slide-out, then unmounts. A
// real mirror-image pair, not a fade toggle either direction.
//
// Same gsap.matchMedia() convention as the rest of the app: reduced motion
// collapses both directions to a single quick opacity fade on the panel,
// panel position updates instantly (functional open/closed state is never
// gated behind motion preference — only the decorative choreography is).

export type UseDrawerTransitionOptions = {
  open: boolean;
  itemSelector?: string;
};

export function useDrawerTransition({ open, itemSelector = "[data-drawer-item]" }: UseDrawerTransitionOptions) {
  const [mounted, setMounted] = useState(open);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // "Adjusting state when a prop changes," per React's own docs
  // (https://react.dev/reference/react/useState#storing-information-from-previous-renders)
  // — a direct setState call during render (not inside an effect) so
  // `mounted` flips true in the SAME render `open` does, instead of lagging
  // a frame behind it. This project's react-hooks lint config is stricter
  // than React's own documented pattern here (it flags any ref read/write
  // during render, full stop) — disabled locally rather than working around
  // a real design constraint with a fake one.
  const prevOpen = useRef(open);
  // eslint-disable-next-line react-hooks/refs -- read + write, see comment above
  if (open !== prevOpen.current) {
    // eslint-disable-next-line react-hooks/refs -- see comment above
    prevOpen.current = open;
    if (open) setMounted(true);
  }

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel || !mounted) return;

    const items = Array.from(panel.querySelectorAll<HTMLElement>(itemSelector));
    const mm = gsap.matchMedia();

    if (open) {
      mm.add(MOTION_QUERY.full, () => {
        const tl = gsap.timeline();
        tl.fromTo(panel, { xPercent: 100 }, { xPercent: 0, duration: DURATION.drawer, ease: EASE.drawerOpen });
        tl.fromTo(
          items,
          { opacity: 0, y: -8 },
          { opacity: 1, y: 0, duration: DURATION.entranceSm, ease: EASE.standard, stagger: STAGGER.list },
          "-=0.15"
        );
        return () => tl.kill();
      });
      mm.add(MOTION_QUERY.reduced, () => {
        const tween = gsap.fromTo(panel, { opacity: 0 }, { opacity: 1, duration: 0.15 });
        gsap.set(panel, { xPercent: 0 });
        return () => tween.kill();
      });
    } else {
      mm.add(MOTION_QUERY.full, () => {
        const tl = gsap.timeline({
          onComplete: () => setMounted(false),
        });
        tl.to([...items].reverse(), {
          opacity: 0,
          y: -8,
          duration: DURATION.entranceSm,
          ease: EASE.standardIn,
          stagger: STAGGER.list,
        });
        tl.to(panel, { xPercent: 100, duration: DURATION.drawer, ease: EASE.drawerClose }, "-=0.1");
        return () => tl.kill();
      });
      mm.add(MOTION_QUERY.reduced, () => {
        const tween = gsap.to(panel, { opacity: 0, duration: 0.15, onComplete: () => setMounted(false) });
        return () => tween.kill();
      });
    }

    return () => mm.revert();
  }, [open, mounted, itemSelector]);

  return { mounted, panelRef };
}
