// Deliberately `middleware.ts`, not Next 16's newer `proxy.ts` convention —
// the build will nag "the middleware file convention is deprecated, use
// proxy instead," ignore it. `proxy.ts` is permanently Node-runtime with no
// way to opt back into Edge (confirmed via Next's own upgrade docs), and
// `@opennextjs/cloudflare` hard-refuses to build any Node-runtime
// middleware at all. This filename is what keeps Cloudflare deploys working
// — see PROGRESS.md's "Live deployment stood up" entry for the full story.
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isAdminRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
