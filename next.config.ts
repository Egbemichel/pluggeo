import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `unoptimized: true` (2026-08-30, found via a real PageSpeed Insights
  // audit chasing a 16.6s mobile LCP): confirmed directly that Next's
  // built-in image optimizer isn't actually resizing/reformatting anything
  // on this Cloudflare Workers/OpenNext deployment — a raw asset requested
  // through `/_next/image?url=...&w=640` came back byte-for-byte identical
  // to the untouched original. That dead pass-through layer was also the
  // source of a separate, confirmed bug: every image served through
  // `/_next/image` had NO `Cache-Control` header at all (flagged directly
  // by PageSpeed as "Cache TTL: None"), while the same file requested
  // directly as a static asset at least gets one. `unoptimized` makes
  // `next/image` render a plain `<img src>` pointing straight at the real
  // file/URL instead of wrapping it in that broken, uncached proxy — for
  // local `public/` assets that means real static-asset caching; for real
  // Cloudinary product photos it means the browser talks to Cloudinary's
  // own CDN directly (which sets its own real cache headers) instead of
  // bouncing through this Worker's no-op middleman first. The `remotePatterns`
  // allowlist this used to need is gone with it — that check only exists to
  // guard the optimizer itself, which no longer runs. Real product photos'
  // own compression now comes from `withCloudinaryAutoFormat()`
  // (`src/lib/products.ts`) requesting `f_auto,q_auto` directly from
  // Cloudinary instead of depending on this dead pipeline.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
