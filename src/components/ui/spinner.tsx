"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { cn, toCssLength } from "@/lib/utils";

// Built from the real Figma node (557:5091): 5 vertical bars of differing
// height/vertical offset — despite the old "pinwheel" read, there's no
// rotation on any bar, so it's really already an equalizer-bar shape, not a
// disc. Rebuilt per the user: instead of the whole SVG spinning as one unit,
// each bar now bounces independently — scaling down from its own bottom
// edge and springing back past full height (`elastic.out`), staggered so
// adjacent bars are out of phase and visibly moving in opposite directions
// at once, like piano keys/an accordion. This is the app-wide loading
// indicator for anything that isn't a grid of product cards (those use
// ProductGridSkeleton/ProductCardSkeleton instead, per the user) — sized via
// the `size` prop for different contexts (inline in a button, centered on a
// page, etc).
//
// GSAP (not CSS) per the project's animation convention: `elastic` easing
// has no clean CSS equivalent, and the bounce needs true per-bar,
// out-of-phase looping. Gated behind `prefers-reduced-motion` via
// `gsap.matchMedia()`, same pattern as TestimonialSection's Flip animation —
// bars render static (full height) when reduced motion is preferred.

const BARS = [
  { x: 0, y: 23, height: 77.1556 },
  { x: 62, y: 23, height: 77.1556 },
  { x: 15, y: 0, height: 83.3778 },
  { x: 45, y: 0, height: 83.3778 },
  { x: 30.1484, y: 34.8442, height: 77.1556 },
];
const BAR_WIDTH = 11.8312;

export type SpinnerProps = {
  /** Number = px width, or any CSS length. Height follows the source aspect ratio (74:112). */
  size?: number | string;
  className?: string;
  label?: string;
};

export function Spinner({ size = 37, className, label = "Loading" }: SpinnerProps) {
  const barRefs = useRef<(SVGRectElement | null)[]>([]);

  useEffect(() => {
    const bars = barRefs.current.filter((el): el is SVGRectElement => el !== null);
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const tweens = bars.map((bar, i) =>
        gsap.to(bar, {
          scaleY: 0.4,
          duration: 0.45,
          ease: "elastic.out(1, 0.5)",
          repeat: -1,
          yoyo: true,
          delay: i * 0.09,
        })
      );
      return () => {
        tweens.forEach((tween) => tween.kill());
      };
    });

    return () => mm.revert();
  }, []);

  return (
    <svg
      role="status"
      aria-label={label}
      viewBox="0 0 74 112"
      width={toCssLength(size)}
      style={{ aspectRatio: "74 / 112" }}
      className={cn("text-brand-primary [&>rect]:origin-bottom", className)}
    >
      {BARS.map((bar, i) => (
        <rect
          key={i}
          ref={(el) => {
            barRefs.current[i] = el;
          }}
          x={bar.x}
          y={bar.y}
          width={BAR_WIDTH}
          height={bar.height}
          fill="currentColor"
          style={{ transformBox: "fill-box" }}
        />
      ))}
    </svg>
  );
}
