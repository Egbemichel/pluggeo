import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import { pageViews } from "@/db/schema";

// Page-view beacon for the daily Telegram analytics report. Fire-and-forget from the
// client (src/components/page-view-tracker.tsx); always answers 204 so a tracking
// problem can never surface to a shopper.
const BOT_USER_AGENT =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|lighthouse|pagespeed|pingdom|uptimerobot|headlesschrome/i;
const NO_TRACK_COOKIE = "pg_no_notify";
const IGNORED_PATH = /^\/(pluggeo|sign-in|api)(\/|$)/;

const bodySchema = z.object({
  visitorId: z.string().min(8).max(64),
  path: z.string().startsWith("/").max(300),
  referrer: z.string().max(500).optional(),
});

function deviceOf(userAgent: string): string {
  if (/ipad|tablet/i.test(userAgent)) return "tablet";
  if (/mobi|android|iphone/i.test(userAgent)) return "mobile";
  return "desktop";
}

function referrerHost(raw: string | undefined, ownHost: string): string | null {
  if (!raw) return null;
  try {
    const host = new URL(raw).hostname.replace(/^www\./, "").toLowerCase();
    return host && host !== ownHost.replace(/^www\./, "") ? host : null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const done = new NextResponse(null, { status: 204 });
  try {
    const userAgent = request.headers.get("user-agent") ?? "";
    if (BOT_USER_AGENT.test(userAgent) || request.cookies.has(NO_TRACK_COOKIE)) {
      return done;
    }

    const parsed = bodySchema.safeParse(JSON.parse(await request.text()));
    if (!parsed.success) return done;

    const path = parsed.data.path.split(/[?#]/)[0] || "/";
    if (IGNORED_PATH.test(path)) return done;

    await db.insert(pageViews).values({
      visitorId: parsed.data.visitorId,
      path,
      productSlug: path.match(/^\/product\/([^/]+)/)?.[1] ?? null,
      referrerHost: referrerHost(parsed.data.referrer, request.nextUrl.hostname),
      country: request.headers.get("cf-ipcountry"),
      device: deviceOf(userAgent),
    });
  } catch (error) {
    console.error("Page view tracking failed:", error);
  }
  return done;
}
