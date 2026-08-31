// Fire-and-forget-shaped, but actually awaited with a short timeout (2026-
// 08-31, per the owner: ping Telegram every time a real visitor lands on
// the storefront, with their IP/country). Middleware only calls this once
// per new visit *session* (see middleware.ts's own cookie logic), not per
// page view, so the awaited round-trip here only ever costs the first page
// load of a session, not every navigation after it.
//
// `TELEGRAM_BOT_TOKEN`/`TELEGRAM_ADMIN_CHAT_ID` are Cloudflare secrets, the
// same pattern as every other credential this project uses — never
// hardcoded. Silently no-ops if either is unset, so this stays optional
// infrastructure the storefront doesn't hard-depend on.

export type VisitorInfo = {
  ip: string;
  country: string;
  userAgent: string;
  path: string;
};

export async function notifyVisitor(info: VisitorInfo): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!token || !chatId) return;

  const text = [
    "New visitor — pluggeo&co",
    `IP: ${info.ip}`,
    `Country: ${info.country}`,
    `Page: ${info.path}`,
    `Browser: ${info.userAgent}`,
  ].join("\n");

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
      // Bounded so a Telegram outage/slowdown never meaningfully delays the
      // one page load per session this runs on.
      signal: AbortSignal.timeout(2000),
    });
  } catch {
    // Never let a Telegram outage/error affect the storefront — this is a
    // side channel for the owner, not something a real visitor should ever
    // notice failing.
  }
}
