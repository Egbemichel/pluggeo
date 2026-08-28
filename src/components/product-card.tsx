import Image from "next/image";
import Link from "next/link";
import { Indicator } from "@/components/ui/indicator";
import { AddToBagButton } from "@/components/ui/add-to-bag-button";
import { cn } from "@/lib/utils";

// Built from the real Figma component (node 557:3742) via the REST API — see
// docs/FIGMA_MAPPING.md. A few measured values don't land on a named design token
// (15px horizontal padding, 41px image-to-content gap) — used as literal arbitrary
// values below rather than rounded to the nearest token, flagged here rather than
// silently rounded.
//
// `layout="row"` is the same component in the Shop page's gallery-mode listing
// (product-grid's sibling nodes 594:569 etc. use the identical info block —
// confirmed literally the same "Frame 250" content — just arranged horizontally,
// borderless, with a bigger image). Kept as one component with a layout prop per
// the user's instruction not to duplicate near-identical components. The row
// image was measured at 341px, which reads too large for a compact list row —
// scaled down here; flag if the literal size was actually intended.
//
// 2026-08-25 QA pass (screenshot-compared, Figma still unreachable): the "card"
// layout's bottom section was previously one Link wrapping image+info, with
// AddToBagButton absolutely pinned to the card's bottom-right corner — this
// left a large dead gap between the price line and the card edge whenever the
// button's reserved inset didn't match the info block's actual content height.
// Rewritten so the info row and button sit in a normal flex row (items-end, so
// the button aligns with the price line like the Figma reference) and the card
// simply hugs its content height. Split into two Links (image, info) instead of
// one wrapping both, since AddToBagButton must stay a sibling of Link, not
// nested inside it — a <button> inside an <a> is invalid/inaccessible markup.
// Corner radius is now responsive (8px mobile / 16px desktop, per the user —
// 16px read oversized on the narrow mobile card) and the category label shrinks
// on mobile (was a fixed 32px that overflowed/wrapped badly on a ~150px-wide
// mobile card); both flagged as best-effort sizing pending real Figma data.
//
// Hover: per the user, the "card" layout (Shop/grid tiles) scales up on hover
// instead of the subtle opacity fade every other clickable element gets
// globally (see globals.css) — the scale lives on the outer <article> (not
// the inner Links) so the whole card grows as one unit; `hover:opacity-100`
// on each Link cancels the global fade so hovering doesn't also dim the
// content while it scales. `hover:z-10` keeps a scaled card from being
// visually clipped by its un-scaled neighbors in the grid. The "row" layout
// (the product list under Shop's ProductSpotlight) explicitly does NOT get
// this — per the user it just keeps the same subtle fade as everything else,
// no scale.

export type ProductCardProps = {
  href: string;
  image: { src: string; alt: string };
  category: string;
  title: string;
  /** USD assumed — currency wasn't part of this component pull, confirm if wrong. */
  price: number;
  /** Struck-through original price, shown only when the product is on sale. */
  compareAtPrice?: number;
  /** Prefixes the price with "From " — set when the product has variants with a price range. */
  isFromPrice?: boolean;
  /** Total image count for this product — renders the dot Indicator when > 1. */
  imageCount?: number;
  activeImageIndex?: number;
  /** "card" (vertical tile, Shop grid) or "row" (horizontal, Shop gallery listing). */
  layout?: "card" | "row";
  /** Row layout only: when set, clicking the row calls this instead of
   * navigating to `href` — used by the Shop page's list layout, where a row
   * selects itself into ProductSpotlight rather than opening the PDP (the
   * spotlight's own "Details" button is the real navigation there). `href`
   * still renders visually identically either way; only the click target
   * changes (an in-page `<button>` instead of a `<Link>`, since a `<button>`
   * inside an `<a>` would be invalid/inaccessible markup anyway — same reason
   * AddToBagButton is already a sibling, not nested). Ignored for "card". */
  onSelect?: () => void;
  /** Row layout only: highlights the row as the one currently feeding
   * ProductSpotlight. Ignored when `onSelect` isn't set. */
  selected?: boolean;
  className?: string;
};

// Exported so ProductSpotlight (shop page's list-layout featured product) can
// format the same way without a second Intl.NumberFormat instance.
export const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function ProductInfo({
  category,
  title,
  price,
  compareAtPrice,
  isFromPrice,
  onSale,
}: {
  category: string;
  title: string;
  price: number;
  compareAtPrice?: number;
  isFromPrice?: boolean;
  onSale: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col">
      {onSale && (
        <p className="text-body-sm font-sans font-light text-text-primary md:text-eyebrow">
          Sale
        </p>
      )}
      {/* 32px/1.4 measured directly on this node in Quinn Bold — that's body-lg's
          *size* but not its line-height (body-lg assumes Inter's 1.21 ratio), so
          spelled out explicitly here rather than reusing a token that would apply
          the wrong line-height for this font. Shrunk below md (still not a
          confirmed Figma mobile value) since the card itself is much narrower
          there (2-up grid) — the *overlapping* glyphs reported at this size turned
          out to be a Quinn-Bold.otf kerning-table bug, not a sizing issue (see the
          global `.font-heading` rule in globals.css); this shrink + tracking-wide
          is just proportion, not the overlap fix. */}
      <h3 className="text-[1.125rem] leading-[1.4] tracking-wide font-heading font-bold text-brand-primary md:text-[2rem] md:tracking-normal">
        {category}
      </h3>
      <p className="text-body-sm font-sans font-normal text-text-primary md:text-card-title">
        {title}
      </p>
      {/* flex-wrap on the row + whitespace-nowrap on each price: if both prices
          don't fit on one line (narrow mobile card, or desktop once the button
          column eats into the info width), the compare-price drops to its own
          line as a whole unit — never breaks mid-string ("From" / "$5,800.00"
          split ugly) and never overflows/overlaps the basket icon (plain
          whitespace-nowrap with no wrap-capable container did, at desktop). */}
      <div className="flex flex-wrap items-baseline gap-(--space-1)">
        <span className="text-body-sm font-sans font-medium whitespace-nowrap text-text-primary md:text-price">
          {isFromPrice ? "From " : ""}
          {currency.format(price)}
        </span>
        {onSale && (
          <span className="text-body-sm font-sans font-medium whitespace-nowrap text-text-secondary line-through md:text-price">
            {currency.format(compareAtPrice!)}
          </span>
        )}
      </div>
    </div>
  );
}

export function ProductCard({
  href,
  image,
  category,
  title,
  price,
  compareAtPrice,
  isFromPrice,
  imageCount = 1,
  activeImageIndex = 0,
  layout = "card",
  onSelect,
  selected,
  className,
}: ProductCardProps) {
  const onSale = compareAtPrice != null && compareAtPrice > price;

  if (layout === "row") {
    const rowContent = (
      <>
        <div className="relative aspect-square w-35 shrink-0 sm:w-55">
          <Image src={image.src} alt={image.alt} fill className="rounded-md object-cover" />
        </div>
        <ProductInfo
          category={category}
          title={title}
          price={price}
          compareAtPrice={compareAtPrice}
          isFromPrice={isFromPrice}
          onSale={onSale}
        />
      </>
    );

    return (
      <article
        className={cn(
          "mx-auto flex w-[calc(100%-36px)] items-center gap-(--space-8) md:w-[calc(100%-98px)]",
          onSelect && selected && "rounded-md ring-1 ring-brand-primary",
          className
        )}
      >
        {onSelect ? (
          <button
            type="button"
            onClick={onSelect}
            aria-pressed={selected}
            className="flex min-w-0 flex-1 items-center gap-(--space-8) text-left"
          >
            {rowContent}
          </button>
        ) : (
          <Link
            href={href}
            transitionTypes={["nav-forward"]}
            className="flex min-w-0 flex-1 items-center gap-(--space-8)"
          >
            {rowContent}
          </Link>
        )}
        <AddToBagButton />
      </article>
    );
  }

  return (
    <article
      className={cn(
        "relative flex w-81.25 flex-col overflow-hidden rounded-sm border border-border-default bg-surface-primary shadow-(--shadow-drop) transition-transform duration-200 hover:z-10 hover:scale-105 md:rounded-md",
        className
      )}
    >
      <Link
        href={href}
        transitionTypes={["nav-forward"]}
        className="relative aspect-square w-full hover:opacity-100"
      >
        <Image src={image.src} alt={image.alt} fill className="object-cover" />
        <Indicator
          count={imageCount}
          activeIndex={activeImageIndex}
          className="absolute right-(--space-5) bottom-(--space-3)"
        />
      </Link>

      <div className="mt-10.25 flex items-end justify-between gap-(--space-2) px-(--space-4) pb-3.75 md:px-3.75">
        <Link
          href={href}
          transitionTypes={["nav-forward"]}
          className="min-w-0 flex-1 hover:opacity-100"
        >
          <ProductInfo
            category={category}
            title={title}
            price={price}
            compareAtPrice={compareAtPrice}
            isFromPrice={isFromPrice}
            onSale={onSale}
          />
        </Link>
        <AddToBagButton className="shrink-0" />
      </div>
    </article>
  );
}
