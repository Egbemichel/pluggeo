// Single source of truth for brand/SEO constants so the name, description,
// and site URL can't drift between layout.tsx, sitemap.ts, robots.ts,
// manifest.ts, opengraph-image.png, and every page's own metadata export.

import type { Metadata } from "next";

export const SITE_NAME = "pluggeo&co";

export const SITE_TAGLINE = "Luxury Jewelry, Watches, Grillz & Chains";

export const SITE_DESCRIPTION =
  "pluggeo&co is a luxury jewelry brand — custom grillz, diamond watches, gold chains, bracelets, and jewelry sets with a streetwear-luxury edge. Shop the full collection online.";

// Falls back to the current live workers.dev URL — update NEXT_PUBLIC_SITE_URL
// once a custom domain is live (no code change needed elsewhere, everything
// reads from this one constant).
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://pluggeo.egbemichel39.workers.dev";

export const THEME_COLOR = "#141b34"; // --navy, see globals.css

export const DEFAULT_OG_IMAGE = "/opengraph-image.png";

// Every static (non-dynamic) storefront page needs the exact same shape of
// title/description/canonical/OG/Twitter metadata — writing it out by hand
// per page is exactly how the sitewide og:image ended up silently missing
// everywhere except the Product page (each page's own explicit `openGraph`
// object replaces rather than merges with the root layout's, so a page that
// declares `openGraph` without `images` loses the image entirely — Next
// does not deep-merge that specific field across segments the way you'd
// expect from the file-convention docs). Dynamic pages (category/product)
// build their own richer version since their image/title vary per request,
// but should follow the same shape.
export function pageMetadata({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}
