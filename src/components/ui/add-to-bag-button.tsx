"use client";

import { ShoppingBasketAdd01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { useBagFlight } from "@/components/bag-flight-provider";
import { cn } from "@/lib/utils";

// Shared Add-to-Bag trigger — wraps useBagFlight so every "add to bag"
// control site-wide (ProductCard's corner icon, PDP's full-width button)
// launches the same flying-icon animation instead of each wiring its own
// click handler. `variant="icon"` replaces ProductCard's previously-unwired
// local AddToBasketButton; `variant="labeled"` replaces the PDP's
// previously-unwired Button (styling copied verbatim from what those two
// already had — this isn't a new visual design, just the first time either
// actually does something on click).

export type AddToBagButtonProps = {
  variant?: "icon" | "labeled";
  className?: string;
};

export function AddToBagButton({ variant = "icon", className }: AddToBagButtonProps) {
  const { fly } = useBagFlight();

  if (variant === "labeled") {
    return (
      <Button
        type="button"
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => fly(e.currentTarget)}
        className={cn(
          "uppercase bg-white border border-brand-primary text-brand-primary text-h3",
          className
        )}
      >
        Add to bag
        <Icon icon={ShoppingBasketAdd01Icon} size={24} className="text-brand-primary" />
      </Button>
    );
  }

  return (
    <button
      type="button"
      aria-label="Add to bag"
      onClick={(e) => fly(e.currentTarget)}
      className={cn("flex size-9 items-center justify-center text-brand-primary md:size-12", className)}
    >
      {/* Icon's `size` prop sets the SVG's width/height attributes (48, the
          desktop value) — the size-* classes below win over those via CSS, so
          the icon actually shrinks to match the smaller mobile button. */}
      <Icon icon={ShoppingBasketAdd01Icon} size={48} className="size-8 md:size-12" />
    </button>
  );
}
