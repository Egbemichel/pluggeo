"use client";

import { useEffect, useMemo, useState } from "react";
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
// ArrowDown01Icon, same rotate-180-when-open).
//
// Full rework (2026-08-31, several rounds of "how should this actually
// behave" with the admin) — `options` (a product's real `product_options`
// rows — what a shopper can pick from) and `variants` (sparse
// `product_variants` overrides — which *complete* combinations cost or
// stock differently) are now two separate inputs instead of one. One chip
// group per option, in the admin's own order (no more "known categories
// first" reshuffling — the admin controls order directly by the order they
// added options). A combination only ever resolves to a real override once
// *every* rendered group has a selection — matched by an exact lookup
// against `variants`, not a "most specific subset" search. That's the
// actual fix for the old ambiguity: two separate single-attribute rows
// could previously both apply to one selection with no way to say which
// price should win. Now there's only ever one row per complete combination,
// so a selection either finds its own row or it doesn't — no competition.
//
// Nothing selected and the dropdown closed by default (2026-08-30, per the
// user): there's a real base product with no customization chosen, and
// that's the correct starting state, not every group defaulting to its
// first value. Tapping an already-selected chip clears it back to nothing.

export type ProductOption = { key: string; values: string[] };

export type ProductVariantOverride = {
  attributes: Record<string, string>;
  available: boolean;
  priceOverride: number | null;
};

function comboKey(attributes: Record<string, string>): string {
  return Object.entries(attributes)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${value}`)
    .join("|");
}

function OptionGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  /** `undefined` when nothing's picked yet for this group — the base
   * product with no chip selected is a real, intended state, not a bug. */
  value: string | undefined;
  /** Tapping the already-selected chip again clears the selection back to
   * nothing, same as tapping any other chip selects it — a real toggle,
   * not a one-way radio group. */
  onChange: (value: string | undefined) => void;
}) {
  return (
    <div className="flex flex-col gap-(--space-4)">
      <h4 className="text-h6 font-heading font-bold text-text-primary">{label}</h4>
      <div className="flex flex-wrap gap-(--space-4)">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option === value ? undefined : option)}
          >
            <Pill active={option === value}>
              <span className="text-body-sm font-sans font-light">{option}</span>
            </Pill>
          </button>
        ))}
      </div>
    </div>
  );
}

export type ProductCustomizeSelection = {
  /** The sparse override row matching the current *complete* selection, if
   * any — `null` while the selection is incomplete (a group still has
   * nothing picked) or complete but never given its own price/availability
   * (which correctly means "use the base product's own price"). */
  variant: ProductVariantOverride | null;
  /** The customer's actual selected values, in the same order as the
   * rendered chip groups (e.g. `["16 Inch", "Rose Gold"]`). Empty while
   * nothing is selected. */
  values: string[];
};

export type ProductCustomizeProps = {
  options: ProductOption[];
  variants: ProductVariantOverride[];
  className?: string;
  /** Called whenever the current chip selection changes — see
   * `ProductCustomizeSelection`. */
  onSelectionChange?: (selection: ProductCustomizeSelection) => void;
};

export function ProductCustomize({ options, variants, className, onSelectionChange }: ProductCustomizeProps) {
  // Nothing selected by default — see file comment.
  const [selected, setSelected] = useState<Record<string, string | undefined>>({});
  // Closed by default (same reasoning) — it's the customer choosing to
  // customize that opens this, not every PDP visit.
  const [open, setOpen] = useState(false);
  const contentRef = useAccordion<HTMLDivElement>(open);

  const variantsByCombo = useMemo(() => {
    const map = new Map<string, ProductVariantOverride>();
    for (const variant of variants) map.set(comboKey(variant.attributes), variant);
    return map;
  }, [variants]);

  const isComplete = options.length > 0 && options.every((o) => selected[o.key] != null);

  // An exact lookup, not a "most specific match wins" search — every row in
  // `variants` already names a complete combination, so a selection either
  // finds its own row or it doesn't. No row for this exact combination
  // means the base product's own price/availability apply, by design.
  const activeVariant = useMemo(() => {
    if (!isComplete) return null;
    const attributes: Record<string, string> = {};
    for (const option of options) attributes[option.key] = selected[option.key]!;
    return variantsByCombo.get(comboKey(attributes)) ?? null;
  }, [isComplete, options, selected, variantsByCombo]);

  const selectedValues = useMemo(
    () => options.map((o) => selected[o.key]).filter((v): v is string => Boolean(v)),
    [options, selected]
  );

  useEffect(() => {
    onSelectionChange?.({ variant: activeVariant, values: selectedValues });
  }, [activeVariant, selectedValues, onSelectionChange]);

  if (options.length === 0) return null;

  const [firstGroup, ...restGroups] = options;

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
        <OptionGroup
          label={firstGroup.key}
          options={firstGroup.values}
          value={selected[firstGroup.key]}
          onChange={(value) => setSelected((prev) => ({ ...prev, [firstGroup.key]: value }))}
        />

        {restGroups.length > 0 && (
          <div className="flex flex-wrap items-stretch gap-(--space-7)">
            {restGroups.map((group, i) => (
              <div key={group.key} className="flex items-stretch gap-(--space-7)">
                {i > 0 && <Divider orientation="vertical" />}
                <OptionGroup
                  label={group.key}
                  options={group.values}
                  value={selected[group.key]}
                  onChange={(value) => setSelected((prev) => ({ ...prev, [group.key]: value }))}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
