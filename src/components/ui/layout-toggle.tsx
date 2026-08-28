"use client";

import { GridViewIcon, GalleryHorizontalIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/icon";
import { useTogglePulse } from "@/hooks/use-toggle-pulse";
import { cn } from "@/lib/utils";

// Built from the real Figma node (557:4197), cross-checked against a second
// instance in shopControlBar (596:602, "gallery active"). Figma's active treatment
// is inconsistent between the two — icon-fill in one, and it doesn't fully commit
// to it (only one of three sub-paths actually fills). Free Hugeicons only ships
// outline icons anyway, so this uses the same gray filled-chip treatment as
// SortToggle instead, for consistency between the two controls in the same bar.

export type LayoutValue = "grid" | "gallery";

export type LayoutToggleProps = {
  value: LayoutValue;
  onValueChange: (value: LayoutValue) => void;
  className?: string;
};

const OPTIONS: { value: LayoutValue; icon: typeof GridViewIcon; label: string }[] = [
  { value: "grid", icon: GridViewIcon, label: "Grid layout" },
  { value: "gallery", icon: GalleryHorizontalIcon, label: "Gallery layout" },
];

export function LayoutToggle({ value, onValueChange, className }: LayoutToggleProps) {
  const setButtonRef = useTogglePulse(value);

  return (
    <div
      role="radiogroup"
      aria-label="Product layout"
      className={cn("flex items-center gap-(--space-3) md:gap-(--space-7)", className)}
    >
      {OPTIONS.map((option) => {
        const selected = option.value === value;

        return (
          <button
            key={option.value}
            ref={setButtonRef(option.value)}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option.label}
            onClick={() => onValueChange(option.value)}
            className={cn(
              "flex size-8 items-center justify-center rounded-sm transition-colors",
              selected ? "bg-gray" : "bg-transparent"
            )}
          >
            <Icon
              icon={option.icon}
              size={20}
              className={selected ? "text-white" : "text-brand-primary"}
            />
          </button>
        );
      })}
    </div>
  );
}
