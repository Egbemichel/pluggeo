import { ViewTransition } from "react";
import { GrillzHeroSection } from "@/components/grillz-hero-section";
import { ProductCollectionSection } from "@/components/product-collection-section";
import { GrillzCastSection } from "@/components/grillz-cast-section";
import { PAGE_TRANSITION } from "@/lib/motion";

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

export default function GrillzPage() {
  return (
    <ViewTransition {...PAGE_TRANSITION}>
      <div className="flex flex-1 flex-col">
        <GrillzHeroSection />
        <ProductCollectionSection
          title="Best Grillz Collection"
          viewAllHref="/shop"
          products={BESTSELLERS_PLACEHOLDER}
        />
        <GrillzCastSection />
      </div>
    </ViewTransition>
  );
}
