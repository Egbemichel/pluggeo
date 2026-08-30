import type { Metadata } from "next";
import { ViewTransition } from "react";
import { notFound } from "next/navigation";
import { ProductDetailSection } from "@/components/product-detail-section";
import { RelatedPiecesSection } from "@/components/related-pieces-section";
import { getProductDetailBySlug, getRelatedProducts } from "@/lib/products";
import { minDelay } from "@/lib/min-delay";
import { PAGE_TRANSITION } from "@/lib/motion";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

// Real per-slug catalog query (2026-08-29) — every product used to render
// the exact same hardcoded title/price/image regardless of slug, with only
// the description varying (picked deterministically from the slug, no real
// per-product copy). Now a genuine 404 for an unknown or unpublished slug,
// via `notFound()`.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductDetailBySlug(slug);
  if (!product) return {};

  const description =
    product.description ?? `${product.title} — ${product.category} from ${SITE_NAME}.`;
  // `openGraph.images` takes the product's own real photo directly rather
  // than generating a composite — metadataBase (root layout) resolves the
  // relative placeholder-product.svg fallback to an absolute URL the same
  // way it would a real Cloudinary URL.
  const image = product.images[0];

  return {
    title: product.title,
    description,
    alternates: { canonical: `/product/${slug}` },
    openGraph: {
      title: product.title,
      description,
      url: `/product/${slug}`,
      images: [{ url: image.src, alt: image.alt }],
    },
    twitter: {
      card: "summary_large_image",
      title: product.title,
      description,
      images: [image.src],
    },
  };
}

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

  // No real inventory/stock tracking exists (checkout/orders are explicitly
  // out of scope, CLAUDE.md) — every product reaching this point is already
  // filtered to `status = "published"`, so InStock is the correct default
  // absent a real signal to say otherwise. If every variant is explicitly
  // marked unavailable, that's the one real signal this app does track.
  const allVariantsUnavailable =
    product.variants.length > 0 && product.variants.every((v) => !v.available);

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description ?? undefined,
    image: product.images.map((img) => new URL(img.src, SITE_URL).toString()),
    category: product.category,
    brand: { "@type": "Brand", name: SITE_NAME },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/product/${slug}`,
      priceCurrency: "USD",
      price: product.price,
      availability: allVariantsUnavailable
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Shop", item: `${SITE_URL}/shop` },
      { "@type": "ListItem", position: 3, name: product.title, item: `${SITE_URL}/product/${slug}` },
    ],
  };

  return (
    <ViewTransition {...PAGE_TRANSITION}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="flex flex-1 flex-col gap-(--space-12) py-(--space-9)">
        <ProductDetailSection
          images={product.images}
          category={product.category}
          title={product.title}
          price={product.price}
          compareAtPrice={product.compareAtPrice}
          description={product.description ?? "No description yet for this piece."}
          variants={product.variants}
        />
        <RelatedPiecesSection products={related} />
      </div>
    </ViewTransition>
  );
}
