import Image from "next/image";
import { Button } from "@/components/ui/button";
import { BackToTopButton } from "@/components/ui/back-to-top-button";
import { cn } from "@/lib/utils";

// Built from the real Figma node (557:4930, "footer") — genuinely different from a
// typical multi-column footer, per the user: a dark promo CTA card (gradient
// background — Figma's was a raster image fill, approximated here with a CSS
// navy-to-black gradient rather than embedding a raster asset, for maintainability)
// with a product photo bleeding out the top-right corner, the existing Button
// component reused for "Shop now", and a minimal copyright row underneath with a
// glassmorphic "back to top" button. Full-bleed — this is the one component allowed
// to break the site's 40px/24px side padding (see (storefront)/layout.tsx).
//
// The card intentionally does NOT clip its own overflow: the chain image is meant
// to bleed out past the card's top edge into the page above it (confirmed against
// a real Figma screenshot — the live version had `overflow-hidden` on the card,
// which silently clipped that bleed instead of letting it show). `rounded-md`
// still rounds the card's own background/border without overflow-hidden — that
// only affects whether children are clipped, not the element's own corners.
//
// The Figma "pointer" icon (a hand-cursor glyph) matches Hugeicons' PointerIcon by
// name exactly, used as-is for the back-to-top button.

export type FooterProps = {
  className?: string;
};

export function Footer({ className }: FooterProps) {
  return (
    <footer className={cn("flex flex-col", className)}>
      <div className="relative rounded-md bg-linear-to-br from-navy to-black px-6 py-10 sm:px-10 sm:py-14">
        <div className="relative z-10 flex max-w-xl flex-col gap-(--space-9)">
          <div className="flex flex-col gap-(--space-3)">
            <h2 className="text-3xl leading-[1.4] font-heading font-bold text-white sm:text-5xl lg:text-[5rem]">
              You Dream it, we make it
            </h2>
            <p className="text-base leading-[1.21] font-sans font-light text-white sm:text-xl lg:text-[1.875rem]">
              Customize your favorite pieces, make them truly your own
            </p>
          </div>
          {/* Real measured values for this node (557:4937/557:4938) — 287×110,
              70px text, same underlying bug as HeroSection's button. Unlike Hero
              (which only renders at the md breakpoint), this card scales its
              headline/subtext across breakpoints (text-3xl→text-5xl→5rem) — a fixed
              70px button would look oversized on mobile, so the text size scales
              with clamp() to roughly track that same range instead of a fixed px
              value; height stays auto (hugs the padding) rather than a fixed 110px. */}
          <Button textSize="clamp(1.75rem, 5vw, 4.375rem)" className="self-start">
            Shop now
          </Button>
        </div>

        <div className="pointer-events-none absolute -top-15 right-0 h-full w-1/3 sm:-top-35">
          <Image
            src="/footer-chain.png"
            alt="image of a chain overflowing the footer content area to the top right"
            fill
            className="object-contain object-top"
          />
        </div>
      </div>

      <div className="flex items-center justify-between py-(--space-7) px-(--space-6)">
        <div className="flex items-center gap-(--space-1) font-sans font-light text-text-primary">
          <span aria-hidden>©</span>
          <span>Copyright</span>
          <Image src="/logo-mark.png" alt="pluggeo&co" width={80} height={46} className="h-6 w-auto" />
          <span>,{new Date().getFullYear()}</span>
        </div>

        <BackToTopButton />
      </div>
    </footer>
  );
}
