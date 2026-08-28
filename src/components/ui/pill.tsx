import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Built from the real Figma "chip" component — the same container (rounded-md,
// black border) is reused for three distinct purposes in the file: hashtag/quote
// text (557:3737), variant-selection chips (557:4829/557:4827), and price-filter
// chips (596:618...596:624) — confirmed identical structure/style across all three,
// just with an active/inactive fill. So this is one component with an `active`
// prop, not three near-duplicate ones. Typography is left to children since the
// hashtag use (Quinn Bold) and the filter/variant use (Inter Light) differ.

export type PillProps = {
  children: ReactNode;
  icon?: ReactNode;
  /** Filled (gray bg, white text) vs outline (transparent, black border/text). */
  active?: boolean;
  className?: string;
};

export function Pill({ children, icon, active, className }: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-(--space-4) rounded-md border-(length:--border-width-default) border-black px-(--space-4) py-(--space-4)",
        active ? "bg-gray text-white" : "bg-transparent text-text-primary",
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
}
