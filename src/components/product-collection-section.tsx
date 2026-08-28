"use client";

import { useState } from "react";
import { type ProductCardProps } from "@/components/product-card";
import { ProductGrid } from "@/components/product-grid";
import { SectionHeader, SectionCarouselNav } from "@/components/section-header";
import { cn } from "@/lib/utils";

// Built from a real screenshot ("Bracelet Collection"/"Pendant Collection") — the
// same SectionHeader + ProductGrid pattern as Bestsellers, reused as one component
// instead of copy-pasting the section markup per collection. Desktop shows the full
// grid (4 columns); mobile shows a real 2-item window with working pagination via
// the chevron (confirmed by the screenshot: only 2 cards visible + a chevron below,
// not a 4-item grid just reflowed to 2 columns). The desktop inline chevron doesn't
// page anything yet (same as Bestsellers already had) — flagged, not blocking.

export type ProductCollectionSectionProps = {
  title: string;
  subtitle?: string;
  viewAllHref: string;
  products: (Omit<ProductCardProps, "layout"> & { key: string })[];
  className?: string;
};

const MOBILE_WINDOW = 2;

export function ProductCollectionSection({
  title,
  subtitle,
  viewAllHref,
  products,
  className,
}: ProductCollectionSectionProps) {
  const [mobileIndex, setMobileIndex] = useState(0);

  const canGoPrev = mobileIndex > 0;
  const canGoNext = mobileIndex + MOBILE_WINDOW < products.length;
  const goPrev = () => setMobileIndex((i) => Math.max(0, i - MOBILE_WINDOW));
  const goNext = () =>
    setMobileIndex((i) => Math.min(products.length - MOBILE_WINDOW, i + MOBILE_WINDOW));
  const mobileProducts = products.slice(mobileIndex, mobileIndex + MOBILE_WINDOW);

  return (
    <section className={cn("flex flex-col gap-(--space-9)", className)}>
      <SectionHeader
        title={title}
        subtitle={subtitle}
        viewAllHref={viewAllHref}
        onPrev={() => {}}
        onNext={() => {}}
      />

      <ProductGrid products={products} columns={4} className="hidden md:grid" />

      <ProductGrid products={mobileProducts} columns={2} className="md:hidden" />
      <SectionCarouselNav
        onPrev={canGoPrev ? goPrev : undefined}
        onNext={canGoNext ? goNext : undefined}
        className="flex justify-center self-center md:hidden"
      />
    </section>
  );
}
