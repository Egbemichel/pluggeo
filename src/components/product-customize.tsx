"use client";

import { useMemo, useState } from "react";
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
// rather than showing an empty or fake selector. Selection is still
// decorative (doesn't drive price/availability) — same scope boundary as
// before, just backed by real chip values now instead of placeholder ones.

export type ProductVariantSummary = {
  label: string;
  attributes: Record<string, string>;
};

function OptionGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
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

export type ProductCustomizeProps = {
  variants: ProductVariantSummary[];
  className?: string;
};

export function ProductCustomize({ variants, className }: ProductCustomizeProps) {
  const groups = useMemo(() => {
    const valuesByKey = new Map<string, Set<string>>();
    for (const variant of variants) {
      for (const [key, value] of Object.entries(variant.attributes)) {
        if (!value) continue;
        const set = valuesByKey.get(key) ?? new Set<string>();
        set.add(value);
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

  const [selected, setSelected] = useState<Record<string, string>>(() =>
    Object.fromEntries(groups.map((g) => [g.key, g.values[0]]))
  );
  const [open, setOpen] = useState(true);
  const contentRef = useAccordion<HTMLDivElement>(open);

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
