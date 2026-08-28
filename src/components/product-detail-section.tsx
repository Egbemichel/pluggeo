"use client";

import { BadgeInfoIcon } from "@hugeicons/core-free-icons";
import { ImageThumbnail } from "@/components/ui/image-thumbnail";
import { Icon } from "@/components/ui/icon";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { AddToBagButton } from "@/components/ui/add-to-bag-button";
import { ProductCustomize } from "@/components/product-customize";
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
  images: { src: string; alt: string }[];
  category: string;
  title: string;
  /** USD assumed, matches ProductCard. */
  price: number;
  compareAtPrice?: number;
  isFromPrice?: boolean;
  /** Placeholder copy per product — no CMS/admin description field exists yet. */
  description: string;
};

export function ProductDetailSection({
  images,
  category,
  title,
  price,
  compareAtPrice,
  isFromPrice,
  description,
}: ProductDetailSectionProps) {
  const onSale = compareAtPrice != null && compareAtPrice > price;
  const fieldsRef = useReveal<HTMLDivElement>({
    direction: "up",
    stagger: STAGGER.list,
    distance: 28,
  });

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
              {isFromPrice ? "From " : ""}
              {currency.format(price)}
            </span>
            {onSale && (
              <span className="text-h5 font-sans font-bold text-text-secondary line-through md:text-h4">
                {currency.format(compareAtPrice!)}
              </span>
            )}
          </div>
        </div>

        <div data-reveal-item className="flex items-start gap-(--space-3)">
          <Icon icon={BadgeInfoIcon} size={20} className="mt-1 shrink-0 text-text-secondary" />
          <p className="text-body-md font-sans font-normal text-text-secondary">{description}</p>
        </div>

        <div data-reveal-item className="self-start">
          <QuantityStepper />
        </div>

        {/* Same button as ProductSpotlight's (Shop's list-layout featured
            section) "ADD TO BAG" — per the user, this is that exact button,
            not a new one. Now genuinely wired: launches the flying-icon
            confirmation toward the navbar bag icon. */}
        <div data-reveal-item>
          <AddToBagButton variant="labeled" />
        </div>

        <div data-reveal-item>
          <ProductCustomize />
        </div>
      </div>
    </div>
  );
}
