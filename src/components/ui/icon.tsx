import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";

import { cn } from "@/lib/utils";

// Thin convenience wrapper around Hugeicons so call sites don't repeat the same
// size/strokeWidth defaults — see docs/COMPONENTS.md for the icon system.
//
// `fill`: Hugeicons' free-tier icons are stroke-only — HugeiconsIcon defaults the
// root <svg> to `fill="none"` and none of the individual paths override that, so
// every icon renders as a pure outline (see StarRating in testimonial-section.tsx
// for the same underlying fact). Passing `fill="currentColor"` here makes any
// *closed* sub-paths in that icon render solid while open/line paths are
// unaffected (fill has no visible effect on a path with no enclosed area) — an
// easy way to get a "filled/active" look for icons that happen to have a closed
// shape, without needing a nonexistent solid variant. Left undefined by default
// and only spread into the underlying props when set, so every other icon on the
// site keeps its normal outline-only rendering.

export type IconProps = {
  icon: IconSvgElement;
  size?: number;
  strokeWidth?: number;
  className?: string;
  fill?: string;
};

export function Icon({ icon, size = 24, strokeWidth = 1.5, className, fill }: IconProps) {
  return (
    <HugeiconsIcon
      icon={icon}
      size={size}
      strokeWidth={strokeWidth}
      className={cn("shrink-0", className)}
      {...(fill !== undefined ? { fill } : {})}
    />
  );
}
