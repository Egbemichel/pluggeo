"use client";

import { ViewTransition } from "react";
import { ShoppingBagRemoveIcon, ShoppingBagCheckIcon } from "@hugeicons/core-free-icons";
import { ProductLineItemCard } from "@/components/product-line-item-card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Divider } from "@/components/ui/divider";
import { currency } from "@/components/product-card";
import { useBagFlight } from "@/components/bag-flight-provider";
import { PAGE_TRANSITION } from "@/lib/motion";

// /bag ("My shopping bag"), built from a pasted screenshot (desktop +
// mobile), no Figma node/link. Reuses ProductLineItemCard (see its own file
// comment — generalized from the search overlay's result row specifically
// for this page's "Remove" action + quantity-per-line-item needs) for each
// item, then a Subtotal/Total Payable summary and a Checkout CTA below.
//
// Real cart (2026-08-30, per the user): items now come from
// `useBagFlight()`'s real `items`/`removeItem`/`setQuantity` (see that
// file's comment — every "Add to bag" click site-wide lands here, persisted
// to localStorage) instead of two hardcoded placeholder rows. Quantity/
// remove genuinely update the same shared cart everywhere it's rendered
// (e.g. the navbar badge), not just this page's own local state.
//
// IMPORTANT SCOPE NOTE: checkout/orders/payments are still explicitly out
// of scope for this build (see CLAUDE.md, docs/PROJECT.md) — only the bag
// itself is real now. "Checkout" is a plain, inert button, same flag as
// before — no checkout flow exists to send it to.
// Route is `/bag`, not `/cart`, per the user; both nav icons already link
// here.

export default function BagPage() {
  const { items, removeItem, setQuantity } = useBagFlight();

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <ViewTransition {...PAGE_TRANSITION}>
      <div className="flex flex-col gap-(--space-9) py-(--space-9)">
        <h1 className="text-h2 font-heading font-bold text-brand-primary">
          My shopping bag ({items.length})
        </h1>

        {items.length === 0 ? (
          <p className="text-body-md font-sans font-normal text-text-secondary">
            Your bag is empty.
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-(--space-6)">
              {items.map((item) => (
                <ProductLineItemCard
                  key={item.id}
                  product={item}
                  quantity={item.quantity}
                  onQuantityChange={(quantity) => setQuantity(item.id, quantity)}
                  action={{
                    label: "Remove",
                    icon: ShoppingBagRemoveIcon,
                    onClick: () => removeItem(item.id),
                  }}
                />
              ))}
            </div>

            <div className="flex flex-col gap-(--space-6)">
              <h2 className="text-h5 font-heading font-bold text-text-primary">Your order</h2>

              <div className="flex items-center justify-between">
                <span className="text-body-md font-sans font-normal text-text-secondary">
                  Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
                </span>
                <span className="text-body-md font-sans font-normal text-text-secondary">
                  {currency.format(subtotal)}
                </span>
              </div>

              <Divider orientation="horizontal" />

              <div className="flex items-center justify-between">
                <span className="text-h5 font-sans font-bold text-text-primary">Total Payable</span>
                <span className="text-h5 font-sans font-bold text-text-primary">
                  {currency.format(subtotal)}
                </span>
              </div>

              <Button className="w-full text-brand-primary  bg-transparent border border-brand-primary justify-between lg:w-xs lg:h-xl md:w-auto md:self-end">
                <p className="text-h2 font-quin font-bold">Checkout</p>
                <span className="flex items-center gap-(--space-4)">
                  <Divider orientation="vertical" length={24} className="bg-brand-primary/30" />
                  <Icon icon={ShoppingBagCheckIcon} size={48} className="text-brand-primary" />
                </span>
              </Button>
            </div>
          </>
        )}
      </div>
    </ViewTransition>
  );
}
