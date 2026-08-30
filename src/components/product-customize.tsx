"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/icon";
import { Pill } from "@/components/ui/pill";
import { Divider } from "@/components/ui/divider";
import { useAccordion } from "@/hooks/use-accordion";
import { VARIANT_ATTRIBUTE_CATEGORIES } from "@/lib/product-attributes";
import { cn } from "@/lib/utils";

// PDP's variant-selector section, sitting directly under "Add to bag" — built
// from a pasted screenshot (desktop + mobile), no Figma node/link. Reuses
// existing pieces rather than inventing new ones: `Pill`'s own file comment
// already calls out "variant-selection chips" as one of its three confirmed
// uses, and the collapsible "Customize ⌄" toggle follows the exact pattern
// PriceFilterPanel's "Custom price" disclosure already established (same
// ArrowDown01Icon, same rotate-180-when-open).
//
// Real variant data (2026-08-29): `variants` (a product's real
// `product_variants` rows) replaces the old hardcoded Size/Width/Gold
// color/Gold type placeholder lists. Renders one chip group per attribute
// category that's actually present across the product's variants — known
// categories (`VARIANT_ATTRIBUTE_CATEGORIES`) render in that fixed order,
// any other key a variant happens to have falls back to appearing after,
// alphabetically (defensive: the admin form only lets you pick from the
// known list, but `attributes` is still a flexible JSONB column, so nothing
// stops old/foreign data from having something else). Renders nothing at
// all — not even the "Customize" toggle — when the product has no variants,
// rather than showing an empty or fake selector.
//
// Selection now drives price/availability (2026-08-30) — previously
// decorative. `onSelectionChange` reports the single variant row whose own
// attributes fully match the current chip selection (or `null` when nothing
// matches, e.g. a combination the admin never actually stocked as its own
// row), letting the parent (ProductDetailSection) swap in that variant's
// `priceOverride`/`available` instead of the base product's. A variant only
// needs to specify the attribute keys it actually varies by — matching
// checks the variant's own keys against the current selection, not every
// rendered group — so a product doesn't need one fully-specified row per
// possible combination for this to work.
//
// Each attribute's value is an array, not a single string (2026-08-30, per
// the admin: one variant row needs to hold every size/color/etc. it comes
// in, sharing that row's own price/availability, rather than needing a
// separate row per value) — every value across every variant still becomes
// its own chip exactly as before, and a variant matches the current
// selection when the selected value for each of its keys is *one of* that
// key's values, not necessarily the only one.

export type ProductVariantSummary = {
  label: string;
  attributes: Record<string, string[]>;
  available: boolean;
  priceOverride: number | null;
};

function OptionGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  /** `undefined` when nothing's picked yet for this group — the base
   * product with no chip selected is a real, intended state, not a bug
   * (2026-08-30, per the user: there's still a base product with no
   * variant, so the default has to be nothing selected). */
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
  /** The variant row (if any) whose own attributes fully match the current
   * chip selection — see file comment. */
  variant: ProductVariantSummary | null;
  /** The customer's actual selected values, in the same order as the
   * rendered chip groups (e.g. `["16 Inch", "White Gold"]`) — independent
   * of which variant row(s) they came from, since two attributes can live
   * on entirely separate rows. Empty while nothing is selected (the base
   * product, no chip active). */
  values: string[];
};

export type ProductCustomizeProps = {
  variants: ProductVariantSummary[];
  className?: string;
  /** Called whenever the current chip selection changes — see
   * `ProductCustomizeSelection`. */
  onSelectionChange?: (selection: ProductCustomizeSelection) => void;
};

export function ProductCustomize({ variants, className, onSelectionChange }: ProductCustomizeProps) {
  const groups = useMemo(() => {
    const valuesByKey = new Map<string, Set<string>>();
    for (const variant of variants) {
      for (const [key, values] of Object.entries(variant.attributes)) {
        const set = valuesByKey.get(key) ?? new Set<string>();
        for (const value of values) {
          if (value) set.add(value);
        }
        valuesByKey.set(key, set);
      }
    }

    const knownKeys = VARIANT_ATTRIBUTE_CATEGORIES.filter((key) => valuesByKey.has(key));
    const otherKeys = [...valuesByKey.keys()]
      .filter((key) => !(VARIANT_ATTRIBUTE_CATEGORIES as readonly string[]).includes(key))
      .sort();

    return [...knownKeys, ...otherKeys].map((key) => ({
      key,
      values: [...(valuesByKey.get(key) ?? [])],
    }));
  }, [variants]);

  // Nothing selected by default — the base product with no variant chosen
  // is a real, intended state (2026-08-30, per the user), not a placeholder
  // waiting to be filled in. Previously defaulted to each group's first
  // value, which meant a customer that never touched the chips still
  // silently had a variant "selected" underneath them.
  const [selected, setSelected] = useState<Record<string, string | undefined>>({});
  // Closed by default (same reasoning) — it's the customer choosing to
  // customize that opens this, not every PDP visit.
  const [open, setOpen] = useState(false);
  const contentRef = useAccordion<HTMLDivElement>(open);

  // The variant (if any) whose own attributes fully match the current
  // selection — see file comment for why a variant only needs to specify
  // the keys it varies by, not every rendered group. `values.includes(undefined)`
  // is always false, so a group with nothing selected correctly excludes
  // every variant that varies by it, same as an actual mismatched value would.
  const activeVariant = useMemo(() => {
    const candidates = variants.filter((v) => {
      const entries = Object.entries(v.attributes).filter(([, values]) => values.length > 0);
      return entries.length > 0 && entries.every(([key, values]) => values.includes(selected[key] ?? ""));
    });
    if (candidates.length === 0) return null;
    return candidates.reduce((mostSpecific, v) =>
      Object.keys(v.attributes).length > Object.keys(mostSpecific.attributes).length ? v : mostSpecific
    );
  }, [variants, selected]);

  const selectedValues = useMemo(
    () => groups.map((g) => selected[g.key]).filter((v): v is string => Boolean(v)),
    [groups, selected]
  );

  useEffect(() => {
    onSelectionChange?.({ variant: activeVariant, values: selectedValues });
  }, [activeVariant, selectedValues, onSelectionChange]);

  if (groups.length === 0) return null;

  const [firstGroup, ...restGroups] = groups;

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
