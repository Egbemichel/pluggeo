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

// Reported back to middleware (2026-08-31, debugging a real "the direct
// Telegram API call works but the site's own path doesn't" report — the
// previous version swallowed every failure with a bare `catch {}`, so there
// was no way to tell missing secrets, a Workers-runtime fetch/AbortSignal
// issue, and a genuine Telegram API rejection apart from each other).
export type NotifyResult =
  | { attempted: false; reason: "missing-config" }
  | { attempted: true; ok: true }
  | { attempted: true; ok: false; error: string };

export async function notifyVisitor(info: VisitorInfo): Promise<NotifyResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!token || !chatId) return { attempted: false, reason: "missing-config" };

  const text = [
    "New visitor — pluggeo&co",
    `IP: ${info.ip}`,
    `Country: ${info.country}`,
    `Page: ${info.path}`,
    `Browser: ${info.userAgent}`,
  ].join("\n");

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
      // Bounded so a Telegram outage/slowdown never meaningfully delays the
      // one page load per session this runs on.
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { attempted: true, ok: false, error: `HTTP ${res.status}: ${body.slice(0, 200)}` };
    }
    return { attempted: true, ok: true };
  } catch (err) {
    // Never let a Telegram outage/error affect the storefront — this is a
    // side channel for the owner, not something a real visitor should ever
    // notice failing. The error is still returned (not thrown) so a caller
    // that wants to see it for debugging can, without any risk to normal
    // requests that just discard this result.
    return { attempted: true, ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
