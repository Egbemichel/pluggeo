import Image from "next/image";
import Link from "next/link";
import type { IconSvgElement } from "@hugeicons/react";
import { Icon } from "@/components/ui/icon";
import { Divider } from "@/components/ui/divider";
import { QuantityStepper, type QuantityStepperProps } from "@/components/ui/quantity-stepper";
import { currency } from "@/components/product-card";

// Shared product-summary row: image + title/category/variant-summary/price
// beside a quantity stepper and a trailing action pill. Originally built as
// SearchResultCard for the search overlay; generalized once the /bag page
// needed the identical layout with "Remove" (ShoppingBagRemoveIcon) instead
// of "Add to bag" (ShoppingBagAddIcon) as the trailing action, and needed to
// read/own each line's quantity for its subtotal — hence `action` (label +
// icon + onClick) instead of a hardcoded "Add to bag" pill, and
// `quantity`/`onQuantityChange` forwarded straight to QuantityStepper's own
// controlled/uncontrolled dual-mode (omit both for the search overlay's
// decorative, self-contained counter).
//
// Image + text content sits inside one Link (matches ProductCard's row
// layout — a button/stepper can't nest inside an <a>, so the CTA controls
// stay siblings of the Link, not children of it). flex-col on mobile: the
// CTA block doesn't shrink, so keeping it as a side-by-side sibling of the
// image+text on a 375px viewport starved the text column down to a few px
// (confirmed via a real overflow check on SearchResultCard, not guessed) —
// it gets its own full-width row below the Link instead. Desktop matches
// the reference's side-by-side placement, where there's room for both.
//
// The variant-summary line shows the real `product_variants.label` a line
// was added with (e.g. "10 / Rose Gold") — real variant data doesn't have a
// fixed size/width/gold-color/gold-type shape (attributes are freeform), so
// this just surfaces whatever the admin actually typed as that variant's
// label, if any.

export type ProductLineItem = {
  href: string;
  image: { src: string; alt: string };
  title: string;
  category: string;
  /** The real variant's own `label`, when a line was added with one
   * selected — omitted for a line added with no variant chosen. */
  variantLabel?: string;
  price: number;
  compareAtPrice?: number;
  isFromPrice?: boolean;
};

export type ProductLineItemAction = {
  label: string;
  icon: IconSvgElement;
  /** Receives the clicked button element — the "Add to bag" action uses it
   * as the flying icon's origin point (see useBagFlight); "Remove" ignores
   * it. */
  onClick?: (sourceEl: HTMLButtonElement) => void;
};

function ActionPill({ action }: { action: ProductLineItemAction }) {
  return (
    <button
      type="button"
      onClick={(e) => action.onClick?.(e.currentTarget)}
      className="flex items-center gap-(--space-3) rounded-md border border-black px-(--space-4) py-(--space-3)"
    >
      <span className="text-body-sm font-sans font-bold text-text-primary uppercase">
        {action.label}
      </span>
      <Divider orientation="vertical" length={20} />
      <Icon icon={action.icon} size={18} className="text-brand-primary" />
    </button>
  );
}

export type ProductLineItemCardProps = {
  product: ProductLineItem;
  action: ProductLineItemAction;
  quantity?: QuantityStepperProps["value"];
  onQuantityChange?: QuantityStepperProps["onChange"];
  /** Overrides the card's own Link click — if provided, called instead of
   * letting Link navigate immediately. The caller owns calling
   * `e.preventDefault()` if it wants to defer/replace the navigation (e.g.
   * SearchOverlay closing itself first, then navigating once it's actually
   * gone). Omitted by every caller that doesn't sit inside a closeable
   * overlay (e.g. /bag), where Link's default behavior is exactly right. */
  onNavigate?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
};

export function ProductLineItemCard({
  product,
  action,
  quantity,
  onQuantityChange,
  onNavigate,
}: ProductLineItemCardProps) {
  const onSale = product.compareAtPrice != null && product.compareAtPrice > product.price;

  return (
    <article className="flex flex-col gap-(--space-4) rounded-md border border-border-default p-(--space-5) md:flex-row md:items-start md:gap-(--space-6)">
      <Link
        href={product.href}
        onClick={onNavigate}
        transitionTypes={["nav-forward"]}
        className="flex min-w-0 gap-(--space-6) md:flex-1"
      >
        <div className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-md md:w-32">
          <Image src={product.image.src} alt={product.image.alt} fill className="object-cover" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-(--space-3)">
          <div className="flex flex-col gap-(--space-1)">
            <h3 className="text-h5 font-sans font-semibold text-text-primary">{product.title}</h3>
            <p className="text-h6 font-heading font-bold text-brand-primary">{product.category}</p>
          </div>

          {product.variantLabel && (
            <p className="text-body-sm font-sans font-normal text-text-secondary">
              {product.variantLabel}
            </p>
          )}

          <div className="flex flex-wrap items-baseline gap-(--space-2)">
            <span className="text-price font-sans font-medium text-text-primary">
              {product.isFromPrice ? "From " : ""}
              {currency.format(product.price)}
            </span>
            {onSale && (
              <span className="text-price font-sans font-medium text-text-secondary line-through">
                {currency.format(product.compareAtPrice!)}
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="flex shrink-0 items-center justify-end gap-(--space-3) md:flex-col md:items-end">
        <QuantityStepper value={quantity} onChange={onQuantityChange} />
        <ActionPill action={action} />
      </div>
    </article>
  );
}
