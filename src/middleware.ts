// Deliberately `middleware.ts`, not Next 16's newer `proxy.ts` convention —
// the build will nag "the middleware file convention is deprecated, use
// proxy instead," ignore it. `proxy.ts` is permanently Node-runtime with no
// way to opt back into Edge (confirmed via Next's own upgrade docs), and
// `@opennextjs/cloudflare` hard-refuses to build any Node-runtime
// middleware at all. This filename is what keeps Cloudflare deploys working
// — see PROGRESS.md's "Live deployment stood up" entry for the full story.
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";
import { notifyVisitor } from "@/lib/telegram";

const isAdminRoute = createRouteMatcher(["/pluggeo(.*)"]);
// Only these routes actually need Clerk (2026-08-31 — see the root layout's
// `ClerkProvider` removal comment for the full story: a Clerk dev
// instance's first-visit cookie handshake redirect used to run against
// every public storefront page too, not just the admin, because the
// matcher covered nearly the whole site). `clerkHandler` below is only ever
// *invoked* for requests matching this — the wide matcher at the bottom of
// this file is safe again now that Clerk's own overhead is gated behind
// this check, not behind the matcher itself.
const isClerkRoute = createRouteMatcher(["/pluggeo(.*)", "/sign-in(.*)", "/api/:path*", "/__clerk/:path*"]);

const clerkHandler = clerkMiddleware(async (auth, req) => {
  if (isAdminRoute(req)) {
    await auth.protect();
  }
});

// Telegram visitor notifications (2026-08-31, per the owner: ping him on
// Telegram with a real visitor's IP/country). Session-scoped, not
// per-page-view — a shopper clicking through 5 pages sends one message, not
// five — via a short-lived cookie. `pg_no_notify` is a long-lived opt-out
// cookie for the owner's own browsing, set by visiting any page with
// `?admin-preview` once.
const VISIT_COOKIE = "pg_visited";
const NO_NOTIFY_COOKIE = "pg_no_notify";
const VISIT_SESSION_SECONDS = 60 * 30;

// Known bots/crawlers/monitors/our-own-audits — filtered out so this stays
// "a real person is on the site," not a firehose of "Googlebot visited"
// every few minutes.
const BOT_USER_AGENT = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|lighthouse|pagespeed|pingdom|uptimerobot|headlesschrome/i;
// Metadata/crawler-only routes — never a real person "visiting the site" in
// the sense this feature means, even though they're real page requests.
const NON_VISIT_PATH = /^\/(robots\.txt|sitemap\.xml|manifest\.webmanifest|icon\.png|apple-icon\.png|opengraph-image\.png)$/;

async function handleStorefrontVisit(req: NextRequest): Promise<NextResponse> {
  if (req.nextUrl.searchParams.has("admin-preview")) {
    const url = new URL(req.nextUrl.pathname, req.url);
    for (const [key, value] of req.nextUrl.searchParams) {
      if (key !== "admin-preview") url.searchParams.append(key, value);
    }
    const res = NextResponse.redirect(url);
    res.cookies.set(NO_NOTIFY_COOKIE, "1", {
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: true,
      sameSite: "lax",
    });
    return res;
  }

  const res = NextResponse.next();

  // TEMPORARY (2026-08-31): a real visit wasn't reaching Telegram even
  // though the token/chat id work when called directly, and the old
  // `catch {}` gave zero visibility into why. `X-PG-Debug-Telegram` header
  // on the request bypasses the cookie gate and reports exactly what
  // happened via a response header, so this can be diagnosed with a plain
  // curl instead of guessing — remove this whole block plus the header
  // check once the real cause is found and fixed.
  const isDebugRequest = req.headers.get("x-pg-debug-telegram") === "1";

  const shouldNotify =
    isDebugRequest ||
    (!req.cookies.has(VISIT_COOKIE) &&
      !req.cookies.has(NO_NOTIFY_COOKIE) &&
      !NON_VISIT_PATH.test(req.nextUrl.pathname) &&
      !BOT_USER_AGENT.test(req.headers.get("user-agent") ?? ""));

  if (shouldNotify) {
    const result = await notifyVisitor({
      ip: req.headers.get("cf-connecting-ip") ?? "unknown",
      country: req.headers.get("cf-ipcountry") ?? "unknown",
      userAgent: req.headers.get("user-agent") ?? "unknown",
      path: req.nextUrl.pathname,
    });
    if (isDebugRequest) res.headers.set("X-PG-Debug-Telegram", JSON.stringify(result));
  }

  // Set regardless of `shouldNotify` (e.g. also for bots) — the point is
  // "don't re-check/re-notify for this browser again this session," not
  // "only remember real visitors."
  res.cookies.set(VISIT_COOKIE, "1", { maxAge: VISIT_SESSION_SECONDS, sameSite: "lax" });
  return res;
}

export default async function middleware(req: NextRequest, event: NextFetchEvent) {
  if (isClerkRoute(req)) {
    return clerkHandler(req, event);
  }
  return handleStorefrontVisit(req);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
