"use client";

import { ViewTransition } from "react";
import { useState } from "react";
import { ShoppingBagRemoveIcon, ShoppingBagCheckIcon } from "@hugeicons/core-free-icons";
import { ProductLineItemCard, type ProductLineItem } from "@/components/product-line-item-card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Divider } from "@/components/ui/divider";
import { currency } from "@/components/product-card";
import { PAGE_TRANSITION } from "@/lib/motion";

// /bag ("My shopping bag"), built from a pasted screenshot (desktop +
// mobile), no Figma node/link. Reuses ProductLineItemCard (see its own file
// comment — generalized from the search overlay's result row specifically
// for this page's "Remove" action + quantity-per-line-item needs) for each
// item, then a Subtotal/Total Payable summary and a Checkout CTA below.
//
// IMPORTANT SCOPE NOTE: checkout/cart/orders/payments are explicitly out of
// scope for this build (see CLAUDE.md, docs/PROJECT.md) — this page is a
// visual mock only. Items live in local component state seeded from
// placeholder data; quantity/remove genuinely work (so the page reads as a
// real bag while you're on it, and the subtotal recomputes correctly), but
// nothing here is wired to a cart table, a real "Add to bag" click anywhere
// else in the app, or persistence of any kind — reloading the page resets
// it. "Checkout" is a plain, inert button, same flag as every other basket/
// add-to-bag control in the app (no checkout flow exists to send it to).
// Route is `/bag`, not `/cart`, per the user; both nav icons already link
// here.

const PLACEHOLDER_IMAGE = { src: "/placeholder-product.svg", alt: "Placeholder product" };

type BagLineItem = ProductLineItem & { id: string; quantity: number };

const INITIAL_ITEMS: BagLineItem[] = [
  {
    id: "bag-0",
    href: "/product/placeholder-0",
    image: PLACEHOLDER_IMAGE,
    title: "22mm chain with custom clasp",
    category: "Bracelets",
    size: "6.5 Inch",
    width: "5.5 mm",
    goldColor: "Rose",
    goldType: "14k",
    price: 5800,
    compareAtPrice: 7650,
    isFromPrice: true,
    quantity: 1,
  },
  {
    id: "bag-1",
    href: "/product/placeholder-0",
    image: PLACEHOLDER_IMAGE,
    title: "22mm chain with custom clasp",
    category: "Bracelets",
    size: "6.5 Inch",
    width: "5.5 mm",
    goldColor: "Rose",
    goldType: "14k",
    price: 5800,
    compareAtPrice: 7650,
    isFromPrice: true,
    quantity: 1,
  },
];

export default function BagPage() {
  const [items, setItems] = useState(INITIAL_ITEMS);

  const removeItem = (id: string) => setItems((prev) => prev.filter((item) => item.id !== id));
  const setQuantity = (id: string, quantity: number) =>
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, quantity } : item)));

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
