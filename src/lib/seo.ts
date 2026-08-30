// Single source of truth for brand/SEO constants so the name, description,
// and site URL can't drift between layout.tsx, sitemap.ts, robots.ts,
// manifest.ts, opengraph-image.tsx, and every page's own metadata export.

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
