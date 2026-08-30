"use client";

import { useState } from "react";
import { BadgeInfoIcon } from "@hugeicons/core-free-icons";
import { ImageThumbnail } from "@/components/ui/image-thumbnail";
import { Icon } from "@/components/ui/icon";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { AddToBagButton } from "@/components/ui/add-to-bag-button";
import { ProductCustomize, type ProductVariantSummary } from "@/components/product-customize";
import { currency } from "@/components/product-card";
import { useReveal } from "@/hooks/use-reveal";
import { STAGGER } from "@/lib/motion";

// PDP's first/top section, built from pasted screenshots (desktop + mobile,
// no Figma node/link this time) — gallery (ImageThumbnail, restyled for this
// exact reference) beside category/title/price/description/"Add to bag".
// Gallery column reads wider than the text column in the reference (not an
// even split), hence the 3/2 grid-cols-5 split rather than grid-cols-2.
// Text sizes are bumped a step above what similar labels use elsewhere
// (ProductInfo's row/card category+price) since this section gets a lot more
// dedicated space per element than a compact product card does — eyeballed
// against the screenshot, not a measured Figma value. "Add to bag" is
// deliberately the *same* button as ProductSpotlight's (Shop's list-layout
// featured section), per the user — not a new button design. QuantityStepper
// (shared with SearchResultCard) sits directly above it, per the user.
//
// Entry: on load, the text/actions column staggers top-to-bottom (category+
// name+price, then details, then the quantity counter, then Add to bag, then
// the Customize dropdown), per the user — a homogeneous fade-up stagger, so
// this reuses useReveal rather than a hand-built timeline. Gallery isn't part
// of the spec'd stagger and keeps its existing static render. Above the fold
// on a PDP, so this fires without scrolling; run-once, same as Hero/Categories.

export type ProductDetailSectionProps = {
  /** Used to build this product's `/product/[slug]` href for its own cart
   * line item — the PDP doesn't link to itself anywhere else. */
  slug: string;
  images: { src: string; alt: string }[];
  category: string;
  title: string;
  /** USD assumed, matches ProductCard. */
  price: number;
  compareAtPrice?: number;
  isFromPrice?: boolean;
  description: string;
  /** The product's real variants — see ProductCustomize's own comment for
   * how these become chip groups. Empty array hides Customize entirely. */
  variants: ProductVariantSummary[];
};

export function ProductDetailSection({
  slug,
  images,
  category,
  title,
  price,
  compareAtPrice,
  isFromPrice,
  description,
  variants,
}: ProductDetailSectionProps) {
  // The variant matching the customer's current chip selection, if any —
  // see ProductCustomize's file comment. `priceOverride` swaps in for the
  // base price and `available` disables Add to Bag, so selecting a variant
  // is no longer decorative.
  const [activeVariant, setActiveVariant] = useState<ProductVariantSummary | null>(null);
  const [quantity, setQuantity] = useState(1);
  const displayPrice = activeVariant?.priceOverride ?? price;
  const available = activeVariant?.available ?? true;
  // A variant's own override price is a fixed final price, not a discount
  // off the base compareAtPrice — the strikethrough only makes sense while
  // showing the base price itself.
  const onSale = activeVariant == null && compareAtPrice != null && compareAtPrice > price;
  const fieldsRef = useReveal<HTMLDivElement>({
    direction: "up",
    stagger: STAGGER.list,
    distance: 28,
  });

  const href = `/product/${slug}`;
  const cartItem = {
    id: activeVariant ? `${href}::${activeVariant.label}` : href,
    href,
    image: images[0],
    title,
    category,
    price: displayPrice,
    compareAtPrice: activeVariant ? undefined : compareAtPrice,
    isFromPrice: activeVariant ? false : isFromPrice,
    variantLabel: activeVariant?.label,
  };

  return (
    <div className="grid gap-(--space-9) md:grid-cols-5 md:items-start md:gap-(--space-12)">
      <ImageThumbnail images={images} className="md:col-span-3" />

      <div ref={fieldsRef} className="flex flex-col gap-(--space-9) md:col-span-2">
        <div data-reveal-item className="flex flex-col gap-(--space-4)">
          <p className="text-h3 lg:text-display font-heading font-bold text-brand-primary md:text-h4">
            {category}
          </p>
          <h1 className="text-h5 lg:text-h2 font-sans font-bold text-text-primary md:text-h3">
            {title}
          </h1>
          <div className="flex flex-wrap items-baseline gap-(--space-2)">
            <span className="text-h5 font-sans font-bold text-text-primary md:text-h4">
              {isFromPrice && activeVariant == null ? "From " : ""}
              {currency.format(displayPrice)}
            </span>
            {onSale && (
              <span className="text-h5 font-sans font-bold text-text-secondary line-through md:text-h4">
                {currency.format(compareAtPrice!)}
              </span>
            )}
          </div>
          {!available && (
            <span className="text-body-sm font-sans font-bold text-destructive">
              Out of stock in this option
            </span>
          )}
        </div>

        <div data-reveal-item className="flex items-start gap-(--space-3)">
          <Icon icon={BadgeInfoIcon} size={20} className="mt-1 shrink-0 text-text-secondary" />
          <p className="text-body-md font-sans font-normal text-text-secondary">{description}</p>
        </div>

        <div data-reveal-item className="self-start">
          <QuantityStepper value={quantity} onChange={setQuantity} />
        </div>

        {/* Same button as ProductSpotlight's (Shop's list-layout featured
            section) "ADD TO BAG" — per the user, this is that exact button,
            not a new one. Genuinely wired: launches the flying-icon
            confirmation toward the navbar bag icon and lands the currently
            selected variant + quantity in the real cart, then resets the
            stepper back to 1 (matches ordinary storefront behavior — the
            next click starts a fresh "how many more"). Disabled when the
            selected variant is explicitly marked unavailable. */}
        <div data-reveal-item>
          <AddToBagButton
            variant="labeled"
            disabled={!available}
            item={cartItem}
            quantity={quantity}
            onAdded={() => setQuantity(1)}
          />
        </div>

        <div data-reveal-item>
          <ProductCustomize variants={variants} onSelectionChange={setActiveVariant} />
        </div>
      </div>
    </div>
  );
}
