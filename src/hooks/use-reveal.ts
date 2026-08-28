"use client";

import gsap from "gsap";
import { useViewportEnter, type UseViewportEnterOptions } from "@/hooks/use-viewport-enter";
import { EASE, DURATION, MOTION_QUERY } from "@/lib/motion";

// Convenience wrapper over useViewportEnter for the common case: a
// homogeneous fade/slide (optionally staggered across matched children) in
// one direction. This is the "Section 2" text/content treatment,
// generalized to non-text blocks too (RevealText is a thin wrapper around
// this for words/lines specifically).
//
// NOT for per-element *different*-direction builds (Hero collage, Categories
// desktop collage) — those call useViewportEnter directly with a hand-built
// gsap.timeline() covering every child explicitly, so the whole group is
// coordinated by construction instead of trying to parameterize N different
// directions through one options object.
//
// Same gsap.matchMedia() convention as TestimonialSection/Spinner: a real
// tween on "no-preference", a plain opacity-only fade (no translate, no
// per-item stagger delay) on "reduce" — shortened motion, not zero feedback.

export type RevealDirection = "up" | "down" | "left" | "right";

export type UseRevealOptions = {
  direction?: RevealDirection;
  /** px offset the reveal travels from. */
  distance?: number;
  duration?: number;
  ease?: string;
  delay?: number;
  /** Per-child interval; when set, animates elements matching `itemSelector`
   * inside the ref'd container instead of the container itself. */
  stagger?: number;
  itemSelector?: string;
} & UseViewportEnterOptions;

function offsetForDirection(direction: RevealDirection, distance: number) {
  switch (direction) {
    case "up":
      return { y: distance };
    case "down":
      return { y: -distance };
    case "left":
      return { x: distance };
    case "right":
      return { x: -distance };
  }
}

export function useReveal<T extends HTMLElement>({
  direction = "up",
  distance = 32,
  duration = DURATION.entranceMd,
  ease = EASE.standard,
  delay = 0,
  stagger,
  itemSelector = "[data-reveal-item]",
  ...viewportOptions
}: UseRevealOptions = {}) {
  return useViewportEnter<T>((container) => {
    const targets = stagger ? Array.from(container.querySelectorAll<HTMLElement>(itemSelector)) : container;
    const mm = gsap.matchMedia();

    mm.add(MOTION_QUERY.full, () => {
      const tween = gsap.fromTo(
        targets,
        { opacity: 0, ...offsetForDirection(direction, distance) },
        { opacity: 1, x: 0, y: 0, duration, ease, delay, stagger }
      );
      return () => tween.kill();
    });

    mm.add(MOTION_QUERY.reduced, () => {
      const tween = gsap.fromTo(targets, { opacity: 0 }, { opacity: 1, duration: 0.15, ease: "power1.out" });
      return () => tween.kill();
    });

    return () => mm.revert();
  }, viewportOptions);
}
