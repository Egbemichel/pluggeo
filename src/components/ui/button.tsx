import type { CSSProperties } from "react";
import { Button as ButtonPrimitive } from "@base-ui/react/button";

import { cn, toCssLength } from "@/lib/utils";

// Built from the real Figma node (557:3730) — black fill, white Quinn Bold text,
// rounded-md (16px, matches --radius-md), gap-[var(--space-4)] (10px) between
// icon/text — pulled directly from that node's auto-layout. Height/width/text-size/
// padding are exposed as props rather than baked into a fixed size scale, since
// Figma only defines one (deliberately oversized, hero-CTA-sized) instance and the
// actual per-use sizing is meant to be controlled by whoever renders the button.
//
// paddingX/paddingY: the Figma node's own 6px-all-sides padding read too tight
// left/right on every real button on the site (per the user) — default horizontal
// padding is now 4x that (24px) while vertical stays at the original 6px, since
// only the horizontal cramping was flagged. `padding` (uniform, all sides) still
// wins over both if explicitly passed, for a caller that genuinely wants a square
// inset instead of a pill-shaped one.

export type ButtonProps = ButtonPrimitive.Props & {
  /** Number = px, or any CSS length. Omit to hug content. */
  height?: number | string;
  width?: number | string;
  /** Omit to use the default (16px / body-md size). */
  textSize?: number | string;
  /** Uniform padding on all four sides — overrides paddingX/paddingY if set. */
  padding?: number | string;
  /** Left/right padding. Omit to use the default (24px, see file comment). */
  paddingX?: number | string;
  /** Top/bottom padding. Omit to use the Figma default (6px). */
  paddingY?: number | string;
};

function Button({
  className,
  height,
  width,
  textSize,
  padding,
  paddingX,
  paddingY,
  style,
  ...props
}: ButtonProps) {
  const dimensionStyle: CSSProperties = {
    height: toCssLength(height),
    width: toCssLength(width),
    fontSize: toCssLength(textSize) ?? "1rem",
    // Quinn's confirmed intrinsic line-height ratio — see docs/DESIGN_SYSTEM.md.
    lineHeight: 1.4,
    padding:
      toCssLength(padding) ??
      `${toCssLength(paddingY) ?? "var(--space-2)"} ${toCssLength(paddingX) ?? "calc(var(--space-2) * 4)"}`,
    ...style,
  };

  return (
    <ButtonPrimitive
      data-slot="button"
      style={dimensionStyle}
      className={cn(
        "group/button inline-flex shrink-0 items-center justify-center gap-(--space-4) rounded-md bg-black font-heading font-bold whitespace-nowrap text-white transition-all outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className
      )}
      {...props}
    />
  );
}

export { Button };
