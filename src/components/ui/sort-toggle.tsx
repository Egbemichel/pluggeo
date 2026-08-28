"use client";

import { ArrowUpZAIcon, ArrowDownZaIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/icon";
import { Divider } from "@/components/ui/divider";
import { useTogglePulse } from "@/hooks/use-toggle-pulse";
import { cn } from "@/lib/utils";

// Built from the real Figma node (557:4383) — arrow-up-z-a / arrow-down-za icons
// separated by a thin gray divider, gap ~19px (snapped to --space-7/20px). Active
// state confirmed from a second instance in shopControlBar (596:602, "A-Z active"):
// gray fill (--gray), rounded-sm.
//
// The active pill's bg/icon-color swap already has a CSS transition; the newly
// active button also gets a quick snappy scale-punch (useTogglePulse) so the
// state change reads as a deliberate confirmation, not just a color fade —
// same treatment as LayoutToggle, per the user's "animate state changes" note.

export type SortDirection = "asc" | "desc";

export type SortToggleProps = {
  value: SortDirection;
  onValueChange: (value: SortDirection) => void;
  className?: string;
};

export function SortToggle({ value, onValueChange, className }: SortToggleProps) {
  const setButtonRef = useTogglePulse(value);

  return (
    <div className={cn("flex items-center gap-(--space-3) md:gap-(--space-7)", className)}>
      <button
        ref={setButtonRef("asc")}
        type="button"
        aria-pressed={value === "asc"}
        aria-label="Sort ascending"
        onClick={() => onValueChange("asc")}
        className={cn(
          "flex size-8 items-center justify-center rounded-sm transition-colors",
          value === "asc" ? "bg-gray" : "bg-transparent"
        )}
      >
        <Icon
          icon={ArrowUpZAIcon}
          size={20}
          className={value === "asc" ? "text-white" : "text-brand-primary"}
        />
      </button>
      <Divider orientation="vertical" length={20} />
      <button
        ref={setButtonRef("desc")}
        type="button"
        aria-pressed={value === "desc"}
        aria-label="Sort descending"
        onClick={() => onValueChange("desc")}
        className={cn(
          "flex size-8 items-center justify-center rounded-sm transition-colors",
          value === "desc" ? "bg-gray" : "bg-transparent"
        )}
      >
        <Icon
          icon={ArrowDownZaIcon}
          size={20}
          className={value === "desc" ? "text-white" : "text-brand-primary"}
        />
      </button>
    </div>
  );
}
