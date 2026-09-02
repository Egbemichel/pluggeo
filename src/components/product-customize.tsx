"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/icon";
import { Pill } from "@/components/ui/pill";
import { Divider } from "@/components/ui/divider";
import { useAccordion } from "@/hooks/use-accordion";
import { currency } from "@/components/product-card";
import { GRILLZ_PER_TOOTH_OPTION_KEYS } from "@/lib/product-attributes";
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
// Nothing selected by default (2026-08-30, per the user): there's a real
// base product with no customization chosen, and that's the correct
// starting state, not every group defaulting to its first value. Tapping
// an already-selected chip clears it back to nothing.
//
// The dropdown itself now starts OPEN (2026-09-02, per the owner —
// reversing the 2026-08-30 "closed by default" decision above: he wants
// Customize visible immediately, not one extra tap away, only collapsing
// when a shopper actually clicks the toggle). Still just the starting
// `useState` value, not force-open — a shopper can still collapse it, and
// it stays collapsed if they do (no scroll/selection re-opens it).
//
// Grillz's Top/Bottom Teeth Count price by multiplying the base price
// instead of `valuePriceDeltas` (2026-09-02, per the owner: a Grillz
// product's own price *is* one tooth's price — see `GRILLZ_PER_TOOTH_
// OPTION_KEYS`'s comment and `additionalPrice`'s `totalTeeth` calculation
// below). Every other option (Mold Kit, Perm Cuts, Deep Cuts, Gold Color,
// Design Type, and every jewelry option) is unaffected — still a flat
// per-value add-on, or an exact-combination `variants` override.

export type ProductOption = {
  key: string;
  values: string[];
  /** Optional per-value price add-on, keyed by one of `values` — see
   * db/schema.ts's comment on `productOptions.valuePriceDeltas`. Empty for
   * any option priced by exact-combination `variants` instead. */
  valuePriceDeltas: Record<string, number>;
};

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

// Top/Bottom Teeth Count price by multiplying the base price instead of a
// per-value add-on — see `GRILLZ_PER_TOOTH_OPTION_KEYS`'s own comment.
function isPerToothOption(key: string): boolean {
  return (GRILLZ_PER_TOOTH_OPTION_KEYS as readonly string[]).includes(key);
}

function OptionGroup({
  label,
  options,
  value,
  priceDeltas,
  hint,
  onChange,
}: {
  label: string;
  options: string[];
  /** `undefined` when nothing's picked yet for this group — the base
   * product with no chip selected is a real, intended state, not a bug. */
  value: string | undefined;
  /** Per-value price add-on shown as a small hint under a chip's label when
   * non-zero, so the cost of a choice is visible before picking it, not
   * just after (e.g. Grillz's Mold Kit/Perm Cuts/Deep Cuts/Gold Color/
   * Design Type — see db/schema.ts's `productOptions.valuePriceDeltas`).
   * Empty for a per-tooth group (its price isn't a fixed per-value number,
   * see `hint` below) or an option that doesn't use this pricing path at
   * all — every chip renders exactly as before either way. */
  priceDeltas: Record<string, number>;
  /** A single explanatory line under the group's own label instead of a
   * per-chip price — used for Top/Bottom Teeth Count ("$1,200 per tooth"),
   * since every chip in that group shares the same per-tooth rate rather
   * than each carrying its own independent add-on. `undefined` for every
   * other group. */
  hint?: string;
  /** Tapping the already-selected chip again clears the selection back to
   * nothing, same as tapping any other chip selects it — a real toggle,
   * not a one-way radio group. */
  onChange: (value: string | undefined) => void;
}) {
  return (
    <div className="flex flex-col gap-(--space-4)">
      <div className="flex flex-col gap-(--space-1)">
        <h4 className="text-h6 font-heading font-bold text-text-primary">{label}</h4>
        {hint && <p className="text-caption font-sans font-light text-text-secondary">{hint}</p>}
      </div>
      <div className="flex flex-wrap gap-(--space-4)">
        {options.map((option) => {
          const delta = priceDeltas[option];
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option === value ? undefined : option)}
            >
              <Pill active={option === value}>
                <span className="flex flex-col items-center">
                  <span className="text-body-sm font-sans font-light">{option}</span>
                  {Boolean(delta) && (
                    <span
                      className={cn(
                        "text-caption font-sans font-light",
                        option === value ? "text-white/80" : "text-text-secondary"
                      )}
                    >
                      +{currency.format(delta!)}
                    </span>
                  )}
                </span>
              </Pill>
            </button>
          );
        })}
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
  /** Sum of every currently-selected value's own `valuePriceDeltas` entry
   * (0 for a product that doesn't use per-value pricing) — accumulates as
   * soon as each chip is picked, independent of whether every group has a
   * selection yet, unlike `variant` which only ever resolves once the
   * whole combination is complete. */
  additionalPrice: number;
};

export type ProductCustomizeProps = {
  options: ProductOption[];
  variants: ProductVariantOverride[];
  /** The product's own base price — used as the per-tooth rate for
   * Top/Bottom Teeth Count (see `GRILLZ_PER_TOOTH_OPTION_KEYS`). Unused
   * for a product with no per-tooth options. */
  price: number;
  className?: string;
  /** Called whenever the current chip selection changes — see
   * `ProductCustomizeSelection`. */
  onSelectionChange?: (selection: ProductCustomizeSelection) => void;
};

export function ProductCustomize({ options, variants, price, className, onSelectionChange }: ProductCustomizeProps) {
  // Nothing selected by default — see file comment.
  const [selected, setSelected] = useState<Record<string, string | undefined>>({});
  // Open by default (2026-09-02, per the owner — see file comment); a
  // shopper can still collapse it via the toggle, which stays collapsed
  // until they tap it again.
  const [open, setOpen] = useState(true);
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

  // Total teeth picked across Top + Bottom Teeth Count combined — the base
  // price is one tooth's price, so the first tooth is already paid for by
  // `price` itself; only teeth beyond that first one add on top (picking
  // "1" alone leaves the price unchanged, "2" doubles it, and a top pick
  // plus a bottom pick add together the same way). Values are plain digit
  // strings (see `GRILLZ_ATTRIBUTE_VALUE_PLACEHOLDER`), not something a
  // shopper types, so `parseInt` is safe; a non-numeric value (shouldn't
  // happen) contributes 0 rather than corrupting the total with `NaN`.
  const totalTeeth = useMemo(
    () =>
      options.reduce((sum, option) => {
        if (!isPerToothOption(option.key)) return sum;
        const value = selected[option.key];
        if (!value) return sum;
        const count = parseInt(value, 10);
        return sum + (Number.isFinite(count) ? count : 0);
      }, 0),
    [options, selected]
  );

  const additionalPrice = useMemo(() => {
    const teethPrice = totalTeeth > 0 ? price * (totalTeeth - 1) : 0;
    const otherPrice = options.reduce((sum, option) => {
      if (isPerToothOption(option.key)) return sum;
      const value = selected[option.key];
      return value ? sum + (option.valuePriceDeltas[value] ?? 0) : sum;
    }, 0);
    return teethPrice + otherPrice;
  }, [options, selected, totalTeeth, price]);

  useEffect(() => {
    onSelectionChange?.({ variant: activeVariant, values: selectedValues, additionalPrice });
  }, [activeVariant, selectedValues, additionalPrice, onSelectionChange]);

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
          priceDeltas={firstGroup.valuePriceDeltas}
          hint={isPerToothOption(firstGroup.key) ? `${currency.format(price)} per tooth` : undefined}
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
                  priceDeltas={group.valuePriceDeltas}
                  hint={isPerToothOption(group.key) ? `${currency.format(price)} per tooth` : undefined}
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
