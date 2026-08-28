"use client";

import { useState } from "react";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/icon";
import { Pill } from "@/components/ui/pill";
import { Divider } from "@/components/ui/divider";
import { useAccordion } from "@/hooks/use-accordion";
import { cn } from "@/lib/utils";

// PDP's variant-selector section, sitting directly under "Add to bag" — built
// from a pasted screenshot (desktop + mobile), no Figma node/link. Reuses
// existing pieces rather than inventing new ones: `Pill`'s own file comment
// already calls out "variant-selection chips" as one of its three confirmed
// uses, and the collapsible "Customize ⌄" toggle follows the exact pattern
// PriceFilterPanel's "Custom price" disclosure already established (same
// ArrowDown01Icon, same rotate-180-when-open). The three lower groups (Width/
// Gold color/Gold type) sit in one row separated by vertical Dividers with no
// explicit `length` — that's the self-stretch fallback added for exactly this
// shape of layout (a Divider spanning a flex row of siblings with variable,
// content-driven height).
//
// No real variant/inventory data model exists yet (out of scope for this
// pass) — options and the default selection are placeholder, matching the
// reference screenshot's own defaults (6.5 Inch / 5mm / Rose / 14k).

const SIZES = ["6 Inch", "6.5 Inch", "16 Inch", "18 Inch", "20 Inch", "22 Inch", "24 Inch"];
const WIDTHS = ["5mm", "7mm"];
const GOLD_COLORS = ["Rose", "Yellow", "White"];
const GOLD_TYPES = ["14k", "18k"];

function OptionGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: T[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-col gap-(--space-4)">
      <h4 className="text-h6 font-heading font-bold text-text-primary">{label}</h4>
      <div className="flex flex-wrap gap-(--space-4)">
        {options.map((option) => (
          <button key={option} type="button" onClick={() => onChange(option)}>
            <Pill active={option === value}>
              <span className="text-body-sm font-sans font-light">{option}</span>
            </Pill>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ProductCustomize({ className }: { className?: string }) {
  const [open, setOpen] = useState(true);
  const [size, setSize] = useState(SIZES[1]);
  const [width, setWidth] = useState(WIDTHS[0]);
  const [goldColor, setGoldColor] = useState(GOLD_COLORS[0]);
  const [goldType, setGoldType] = useState(GOLD_TYPES[0]);
  const contentRef = useAccordion<HTMLDivElement>(open);

  return (
    <div className={cn("flex flex-col gap-(--space-6)", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-(--space-3) self-start text-h5 font-heading font-bold text-text-primary"
      >
        Customize
        <Icon
          icon={ArrowDown01Icon}
          size={24}
          className={cn("transition-transform", open && "rotate-180")}
        />
      </button>

      <div ref={contentRef} className="flex flex-col gap-(--space-6)">
        <OptionGroup label="Size" options={SIZES} value={size} onChange={setSize} />

        <div className="flex flex-wrap items-stretch gap-(--space-7)">
          <OptionGroup label="Width" options={WIDTHS} value={width} onChange={setWidth} />
          <Divider orientation="vertical" />
          <OptionGroup
            label="Gold color"
            options={GOLD_COLORS}
            value={goldColor}
            onChange={setGoldColor}
          />
          <Divider orientation="vertical" />
          <OptionGroup label="Gold type" options={GOLD_TYPES} value={goldType} onChange={setGoldType} />
        </div>
      </div>
    </div>
  );
}
