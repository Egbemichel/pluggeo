import { ViewTransition } from "react";
import { CategoryCollage } from "@/components/category-collage";
import { CelebrityShowcase } from "@/components/celebrity-showcase";
import { HeroSection } from "@/components/hero-section";
import { ProductCollectionSection } from "@/components/product-collection-section";
import { SectionHeader } from "@/components/section-header";
import { TestimonialSection } from "@/components/testimonial-section";
import { Pill } from "@/components/ui/pill";
import { getCelebrities } from "@/lib/celebrities";
import { PAGE_TRANSITION } from "@/lib/motion";

// The full real Home page — every section here is built from real Figma nodes or
// user-provided screenshots (see PROGRESS.md for the source of each). Testimonials
// is the last section before Footer (rendered in the shared storefront layout).
// No more "temporary component showcase" — that scratch section (every atom/
// molecule demoed in one place) has been retired now that the real page is
// complete; individual components stay verifiable via the pages that use them.

function makePlaceholderProducts(prefix: string, count: number) {
  return Array.from({ length: count }, (_, i) => ({
    key: `${prefix}-${i}`,
    href: `/product/placeholder-${prefix}-${i}`,
    image: { src: "/placeholder-product.svg", alt: "Placeholder product" },
    category: "Bracelets",
    title: "22mm chain with custom clasp",
    price: 5800,
    compareAtPrice: 7650,
    isFromPrice: true,
  }));
}

const BESTSELLERS_PLACEHOLDER = makePlaceholderProducts("bestseller", 4);
const BRACELET_COLLECTION_PLACEHOLDER = makePlaceholderProducts("bracelet-collection", 4);
const PENDANT_COLLECTION_PLACEHOLDER = makePlaceholderProducts("pendant-collection", 4);

export default function Home() {
  const celebrities = getCelebrities();

  return (
    <ViewTransition {...PAGE_TRANSITION}>
      <div className="flex flex-1 flex-col gap-16 py-8">
        <HeroSection />

        {/* Built from Figma 603:657 (desktop) + 611:664 (mobile, described not seen:
            on mobile the Quinn headline, Inter subtext, and both pills stack
            vertically instead of the desktop row layout). Headline bumped from
            text-h3 to text-h2 — a real Figma screenshot showed it clearly larger than
            the original (rate-limited) guess. Flag if still off. */}
        <section className="flex flex-col gap-(--space-6) md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-(--space-8)">
          <div className="flex flex-col gap-(--space-2) md:flex-row md:flex-wrap md:items-baseline md:gap-(--space-4)">
            <h2 className="text-h2 font-heading font-bold text-brand-primary">
              Buy once, wear forever
            </h2>
            <span className="text-body-lg font-sans font-normal text-text-secondary">
              LIMITED TIME ONLY
            </span>
          </div>
          <div className="flex flex-col gap-(--space-4) md:flex-row md:items-center md:gap-(--space-6)">
            <Pill>
              <span className="text-h4 font-heading font-bold text-brand-primary">
                #theplugway
              </span>
            </Pill>
            <Pill>
              <span className="text-h4 font-heading font-bold text-brand-primary">
                #youdreamitwemakeit
              </span>
            </Pill>
          </div>
        </section>

        {/* Built from Figma 603:658 (desktop). Mobile layout corrected against a real
            screenshot (see SectionHeader/ProductCollectionSection): "View all" stays
            inline on mobile, only the chevron relocates below, and mobile shows a
            real 2-item paginated window rather than a static reflowed grid. The
            product row itself is still placeholder data — no node ID given yet. */}
        <ProductCollectionSection
          title="Bestsellers"
          viewAllHref="/shop"
          products={BESTSELLERS_PLACEHOLDER}
        />

        {/* "Our categories" — SectionHeader (title+subtitle, no "View all"/chevron)
            followed by CategoryCollage (bento grid of category tiles, replaced the
            CategoryDial picker per the user — built from pasted screenshots, not a
            Figma node, so proportions are approximated). */}
        <section className="flex flex-col gap-(--space-9)">
          <SectionHeader
            title="Our categories"
            subtitle="THERE'S A PIECE FOR EVERY OCCASION"
          />
          <CategoryCollage />
        </section>

        {/* Built from pasted screenshots (no Figma node). Two independent controls:
            the celebrity dial (vertical desktop / horizontal mobile — same
            CategoryDial, just orientation) picks the celebrity; the header's chevron
            pages that celebrity's media (only enabled when they have more than 2). */}
        <CelebrityShowcase celebrities={celebrities} />

        {/* Built from a real screenshot ("Bracelet Collection"/"Pendant Collection") —
            same SectionHeader + ProductGrid pattern as Bestsellers, via the shared
            ProductCollectionSection rather than duplicating the section markup. */}
        <ProductCollectionSection
          title="Bracelet Collection"
          subtitle="LIMITED STOCK AVAILABLE"
          viewAllHref="/category/bracelets"
          products={BRACELET_COLLECTION_PLACEHOLDER}
        />
        <ProductCollectionSection
          title="Pendant Collection"
          subtitle="FREE SHIPPING ENDS MIDNIGHT"
          viewAllHref="/category/pendants"
          products={PENDANT_COLLECTION_PLACEHOLDER}
        />

        {/* Built from pasted screenshots (no Figma node) — last section before
            Footer. */}
        <TestimonialSection />
      </div>
    </ViewTransition>
  );
}
