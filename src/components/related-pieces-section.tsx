import Link from "next/link";
import { SectionHeader } from "@/components/section-header";
import { ProductGrid } from "@/components/product-grid";
import { Button } from "@/components/ui/button";

// PDP's second section, sitting right under ProductCustomize — built from a
// pasted screenshot (desktop + mobile), no Figma node/link. Same responsive
// grid split every other product grid on the site already uses (4-col
// desktop / 2-col mobile). Kept as its own small component rather than
// sharing CategoryPageContent's near-identical "More from us" block: the two
// differ in one real way (this CTA is full-width on mobile, self-sizing on
// desktop, where "More from us" hugs its own content at every breakpoint),
// and the duplicated JSX is only a few lines — not worth a shared
// abstraction for that.
//
// Header copy is written for Plug Geo specifically rather than reusing the
// reference's generic placeholder wording, matching the voice already used
// elsewhere on the site ("Buy once, wear forever", "Where artistry meets
// innovation", "You dream it, we make it").
//
// No real "related products" logic exists yet (no catalog/recommendation
// query) — placeholder data, same shape as every other placeholder grid.

const PLACEHOLDER_IMAGE = { src: "/placeholder-product.svg", alt: "Placeholder product" };

const RELATED_PRODUCTS = [
  { key: "related-0", category: "Bracelets" },
  { key: "related-1", category: "Chains" },
  { key: "related-2", category: "Chains" },
  { key: "related-3", category: "Bracelets" },
].map(({ key, category }) => ({
  key,
  href: `/product/${key}`,
  image: PLACEHOLDER_IMAGE,
  category,
  title: "22mm chain with custom clasp",
  price: 5800,
  compareAtPrice: 7650,
  isFromPrice: true,
}));

export function RelatedPiecesSection() {
  return (
    <div className="flex flex-col gap-(--space-9)">
      <SectionHeader title="More From The Plug" subtitle="MORE WAYS TO STAY ICED OUT" />

      <ProductGrid products={RELATED_PRODUCTS} columns={4} className="hidden md:grid" />
      <ProductGrid products={RELATED_PRODUCTS} columns={2} className="md:hidden" />

      <div className="flex flex-wrap items-center gap-(--space-4)">
        <Button
          render={
            <Link href="/shop" transitionTypes={["nav-forward"]}>
              Explore more
            </Link>
          }
          height={64}
          textSize={28}
        />
      </div>
    </div>
  );
}
