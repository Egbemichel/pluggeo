"use client";

import { useState } from "react";
import { Add01Icon, MinusSignIcon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

// Extracted out of SearchResultCard once the PDP needed the identical
// control above its "Add to bag" button — no Figma node/link, built from
// the same pasted search-overlay screenshot. Decorative-only in the search
// overlay and PDP (no cart/checkout exists in scope, see docs/PROJECT.md,
// same flag as ProductCard's own basket button) — but the /bag page needs
// to read the current quantity to compute a subtotal, so this is a
// controlled/uncontrolled dual-mode component (same shape as PriceFilterPanel's
// "fully controlled" fields) rather than two separate steppers: pass
// `value`/`onChange` when a parent needs to own the number (bag line items),
// omit them for a self-contained decorative counter (search results, PDP).

export type QuantityStepperProps = {
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  className?: string;
};

export function QuantityStepper({
  value,
  defaultValue = 1,
  onChange,
  className,
}: QuantityStepperProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const quantity = value ?? internalValue;

  const setQuantity = (next: number) => {
    if (value === undefined) setInternalValue(next);
    onChange?.(next);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-(--space-4) rounded-full border border-black px-(--space-4) py-(--space-2)",
        className
      )}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => setQuantity(Math.max(1, quantity - 1))}
      >
        <Icon icon={MinusSignIcon} size={16} className="text-brand-primary" />
      </button>
      <span className="text-body-sm font-sans font-medium text-text-primary">{quantity}</span>
      <button type="button" aria-label="Increase quantity" onClick={() => setQuantity(quantity + 1)}>
        <Icon icon={Add01Icon} size={16} className="text-brand-primary" />
      </button>
    </div>
  );
}
