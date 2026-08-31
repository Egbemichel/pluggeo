import { revalidatePath } from "next/cache";

// Every product/category mutation needs this, not just its own admin list
// page. The storefront (Home, Shop, Grillz, category pages, PDP) is already
// `force-dynamic`, so the *server* always renders it fresh — confirmed
// directly: a brand-new product written straight to the DB showed up on a
// fresh `/shop` request with zero delay, no server/CDN caching involved.
// The actual gap (2026-08-31, the admin: "why do I need a refresh every
// time I upload a product") was Next's *client* Router Cache, which still
// serves a stale RSC payload for a same-session `<Link>` navigation (e.g.
// the admin's own "Back to site" link) until something calls
// `revalidatePath` for that path — and none of the product/category actions
// ever did, beyond their own `/pluggeo/**` admin list. `"/"` with the
// `"layout"` type invalidates every route nested under the shared
// storefront layout in one call, so a new/changed product or category shows
// up correctly everywhere it can render (home, shop, grillz, every category
// slug, the PDP) without enumerating each one — and since `force-dynamic`
// pages have nothing cached server-side to invalidate in the first place,
// this costs nothing in performance/SEO/accessibility; it only clears the
// client-side cache entry.
export function revalidateStorefront() {
  revalidatePath("/", "layout");
}
