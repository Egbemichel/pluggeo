import { ViewTransition } from "react";
import { notFound } from "next/navigation";
import { ProductDetailSection } from "@/components/product-detail-section";
import { RelatedPiecesSection } from "@/components/related-pieces-section";
import { getProductDetailBySlug, getRelatedProducts } from "@/lib/products";
import { minDelay } from "@/lib/min-delay";
import { PAGE_TRANSITION } from "@/lib/motion";

// Real per-slug catalog query (2026-08-29) — every product used to render
// the exact same hardcoded title/price/image regardless of slug, with only
// the description varying (picked deterministically from the slug, no real
// per-product copy). Now a genuine 404 for an unknown or unpublished slug,
// via `notFound()`.

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // `Promise.all` with a minimum delay so this route's loading.tsx gets a
  // real, visible moment instead of flashing for a frame.
  const [{ slug }] = await Promise.all([params, minDelay(400)]);

  const product = await getProductDetailBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.categoryId, product.id);

  return (
    <ViewTransition {...PAGE_TRANSITION}>
      <div className="flex flex-1 flex-col gap-(--space-12) py-(--space-9)">
        <ProductDetailSection
          images={product.images}
          category={product.category}
          title={product.title}
          price={product.price}
          compareAtPrice={product.compareAtPrice}
          description={product.description ?? "No description yet for this piece."}
        />
        <RelatedPiecesSection products={related} />
      </div>
    </ViewTransition>
  );
}
