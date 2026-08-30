import type { Metadata } from "next";
import { ViewTransition } from "react";
import { CategoryCollage } from "@/components/category-collage";
import { CelebrityShowcase } from "@/components/celebrity-showcase";
import { HeroSection } from "@/components/hero-section";
import { ProductCollectionSection } from "@/components/product-collection-section";
import { SectionHeader } from "@/components/section-header";
import { TestimonialSection } from "@/components/testimonial-section";
import { Pill } from "@/components/ui/pill";
import { getCelebrities } from "@/lib/celebrities";
import { getFeaturedProducts, getPublishedProductsByCategorySlug } from "@/lib/products";
import { PAGE_TRANSITION } from "@/lib/motion";
import { SITE_NAME, SITE_TAGLINE, SITE_DESCRIPTION, DEFAULT_OG_IMAGE } from "@/lib/seo";

// Deliberately doesn't set `title` here — the root layout's `title.default`
// (`{SITE_NAME} — {SITE_TAGLINE}`) is already exactly what this page wants,
// and setting the same string again as a page-level `title` would go
// through the root's `%s | pluggeo&co` template and double the brand name
// (confirmed by a real `curl` check: "pluggeo&co — ... | pluggeo&co").
// `openGraph`/`twitter` still need to be explicit — a page's own `openGraph`
// object replaces rather than deep-merges with the root layout's, which is
// what silently dropped `images` everywhere before this was caught.
export const metadata: Metadata = {
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    url: "/",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
};

// The full real Home page — every section here is built from real Figma nodes or
// user-provided screenshots (see PROGRESS.md for the source of each). Testimonials
// is the last section before Footer (rendered in the shared storefront layout).
// No more "temporary component showcase" — that scratch section (every atom/
// molecule demoed in one place) has been retired now that the real page is
// complete; individual components stay verifiable via the pages that use them.
//
// Real product data (2026-08-29): Bestsellers = admin-curated featured
// products (`/pluggeo/homepage`); Bracelet/Pendant Collection = real products
// in those categories. Each `ProductCollectionSection` renders nothing when
// its list is empty (see that component's own comment) rather than an empty
// grid under a header.
//
// `dynamic = "force-dynamic"`: without this, Next has no signal that a
// plain Drizzle query (not its own instrumented `fetch()`) should ever go
// stale, so it prerendered this page once at build time and kept serving
// that same snapshot on every request — confirmed via a real `next build`
// showing `○ /` (static) despite the DB calls above. That would mean a
// product an admin publishes/edits/features never actually appears on the
// live site until the next deploy, defeating the entire point of the admin
// CMS. Same reasoning applies to every other storefront page with no
// dynamic route param (`/shop`, `/grillz`) — `/product/[slug]` and
// `/category/[slug]` already rendered dynamic on their own (no
// `generateStaticParams`, so Next can't prerender specific slugs).
export const dynamic = "force-dynamic";

export default async function Home() {
  const [celebrities, bestsellers, braceletCollection, pendantCollection] = await Promise.all([
    Promise.resolve(getCelebrities()),
    getFeaturedProducts(4),
    getPublishedProductsByCategorySlug("bracelets").then((r) => r.products.slice(0, 4)),
    getPublishedProductsByCategorySlug("pendants").then((r) => r.products.slice(0, 4)),
  ]);

  return (
    <ViewTransition {...PAGE_TRANSITION}>
      <div className="flex flex-1 flex-col gap-16 py-8">
        {/* Visually hidden — the hero's own "Best collection" headline (an <h2>)
            carries the visual weight per Figma, but the page had no real <h1>
            at all before this (confirmed via grep — only ever appeared as
            image alt/aria-label text, never a heading; this is what
            e2e/home.spec.ts's long-flagged "heading not found" mismatch in
            PROGRESS.md was actually pointing at). One real, keyword-carrying
            h1 per page is a baseline SEO/accessibility requirement. */}
        <h1 className="sr-only">
          pluggeo&co — Luxury Jewelry, Watches, Grillz, Chains &amp; Bracelets
        </h1>
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
            real 2-item paginated window rather than a static reflowed grid. */}
        <ProductCollectionSection
          title="Bestsellers"
          viewAllHref="/shop"
          products={bestsellers}
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
          products={braceletCollection}
        />
        <ProductCollectionSection
          title="Pendant Collection"
          subtitle="FREE SHIPPING ENDS MIDNIGHT"
          viewAllHref="/category/pendants"
          products={pendantCollection}
        />

        {/* Built from pasted screenshots (no Figma node) — last section before
            Footer. */}
        <TestimonialSection />
      </div>
    </ViewTransition>
  );
}
