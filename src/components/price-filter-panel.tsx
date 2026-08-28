"use client";

import {
  FilterHorizontalIcon,
  ArrowDown01Icon,
  ArrowRight05Icon,
} from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/icon";
import { Divider } from "@/components/ui/divider";
import { Pill } from "@/components/ui/pill";
import { useAccordion } from "@/hooks/use-accordion";
import { cn } from "@/lib/utils";

// Extracted from ShopSidebar (596:644) — was the second half of that component
// (the "Filter" header + Price section), pulled out so the same UI can be shared
// between the desktop sidebar and the new mobile filter drawer instead of being
// duplicated. Fully controlled (no local state) so a shared "is any filter
// active" value can be derived by whichever parent owns the state — that's what
// drives the mobile trigger button's filled-icon indicator in ShopControlsBar.
//
// "Custom price" disclosure reuses ProductCustomize's accordion mechanic
// (useAccordion) — same open/close treatment, per the user. Top-level groups
// (Filter header, Price section, Custom price) carry `data-drawer-item` so
// MobileFilterDrawer's stagger has real distinct rows to animate; the desktop
// sidebar render of this same component ignores the attribute (no drawer
// stagger runs there).

export const PRICE_RANGES = [
  { id: "under-500", label: "Under $500" },
  { id: "500-1000", label: "$500-$1,000" },
  { id: "1000-5000", label: "$1,000-$5,000" },
  { id: "5000-plus", label: "$5,000+" },
] as const;

export const DEFAULT_MIN_PRICE = "0";
export const DEFAULT_MAX_PRICE = "1000";

export type PriceFilterState = {
  activePriceRange: string | null;
  customPriceOpen: boolean;
  minPrice: string;
  maxPrice: string;
};

/** True when the user has actually changed something from the defaults —
 * drives the mobile trigger's filled-icon indicator. */
export function hasActivePriceFilter(state: PriceFilterState) {
  return (
    state.activePriceRange !== null ||
    state.minPrice !== DEFAULT_MIN_PRICE ||
    state.maxPrice !== DEFAULT_MAX_PRICE
  );
}

export type PriceFilterPanelProps = PriceFilterState & {
  onPriceRangeChange: (id: string | null) => void;
  onCustomPriceOpenChange: (open: boolean) => void;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
  className?: string;
};

export function PriceFilterPanel({
  activePriceRange,
  customPriceOpen,
  minPrice,
  maxPrice,
  onPriceRangeChange,
  onCustomPriceOpenChange,
  onMinPriceChange,
  onMaxPriceChange,
  className,
}: PriceFilterPanelProps) {
  const customPriceRef = useAccordion<HTMLDivElement>(customPriceOpen);

  return (
    <div className={cn("flex flex-col gap-(--space-7)", className)}>
      <div data-drawer-item className="flex items-center gap-(--space-6)">
        <Icon icon={FilterHorizontalIcon} size={20} className="text-brand-primary" />
        <Divider orientation="vertical" length={20} />
        <span className="text-body-md font-sans font-normal text-text-primary">Filter</span>
      </div>

      <div className="flex flex-col gap-(--space-5)">
        <div data-drawer-item className="flex flex-col gap-(--space-5)">
          <h4 className="text-h6 font-heading font-bold text-text-primary">Price</h4>
          <div className="flex flex-wrap gap-(--space-4)">
            {PRICE_RANGES.map((range) => (
              <button
                key={range.id}
                type="button"
                onClick={() =>
                  onPriceRangeChange(range.id === activePriceRange ? null : range.id)
                }
              >
                <Pill active={activePriceRange === range.id}>
                  <span className="text-body-sm font-sans font-light">{range.label}</span>
                </Pill>
              </button>
            ))}
          </div>
        </div>

        <div data-drawer-item className="flex flex-col gap-(--space-5)">
          <button
            type="button"
            onClick={() => onCustomPriceOpenChange(!customPriceOpen)}
            aria-expanded={customPriceOpen}
            className="flex items-center gap-(--space-2) self-start text-body-md font-sans font-normal text-text-primary"
          >
            Custom price
            <Icon
              icon={ArrowDown01Icon}
              size={20}
              className={cn("transition-transform", customPriceOpen && "rotate-180")}
            />
          </button>

          <div ref={customPriceRef} className="flex flex-col gap-(--space-2)">
            <div className="flex items-center justify-between text-body-sm font-sans text-text-secondary">
              <span>min</span>
              <span>max</span>
            </div>
            <div className="flex items-center gap-(--space-4)">
              <Pill className="flex-1 justify-center">
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => onMinPriceChange(e.target.value)}
                  className="w-full bg-transparent text-center text-body-sm font-sans font-light text-text-primary outline-none"
                />
              </Pill>
              <Icon icon={ArrowRight05Icon} size={16} className="text-brand-primary" />
              <Pill className="flex-1 justify-center">
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => onMaxPriceChange(e.target.value)}
                  className="w-full bg-transparent text-center text-body-sm font-sans font-light text-text-primary outline-none"
                />
              </Pill>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
