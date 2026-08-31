// Deliberately `middleware.ts`, not Next 16's newer `proxy.ts` convention —
// the build will nag "the middleware file convention is deprecated, use
// proxy instead," ignore it. `proxy.ts` is permanently Node-runtime with no
// way to opt back into Edge (confirmed via Next's own upgrade docs), and
// `@opennextjs/cloudflare` hard-refuses to build any Node-runtime
// middleware at all. This filename is what keeps Cloudflare deploys working
// — see PROGRESS.md's "Live deployment stood up" entry for the full story.
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isAdminRoute = createRouteMatcher(["/pluggeo(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isAdminRoute(req)) {
    await auth.protect();
  }
});

// Scoped to exactly the routes that need Clerk (2026-08-31, the same
// PageSpeed-driven fix as the root layout's `ClerkProvider` removal — see
// its comment) — this used to match nearly the entire site, which meant a
// Clerk dev instance's first-visit cookie handshake redirect ran against
// every public storefront page too, not just the admin. `/api` stays
// matched for `cloudinary-sign`, which calls `auth()` directly rather than
// going through `isAdminRoute`'s `auth.protect()`.
export const config = {
  matcher: ["/pluggeo(.*)", "/sign-in(.*)", "/api/:path*", "/__clerk/:path*"],
};
