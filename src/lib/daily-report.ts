import { collectDailyStats, pruneOldPageViews } from "@/lib/analytics";
import { renderTelegramCard } from "@/lib/analytics-card";
import { sendTelegramHtml } from "@/lib/telegram";

/**
 * Builds the last-24-hours analytics card and sends it to Telegram. Used by the
 * midnight cron (worker.ts) and by the admin-only /pluggeo/report route.
 * `REPORT_TIMEZONE` (an IANA name like "Africa/Douala") only affects how the date
 * and peak hour are labelled; the window is always the 24h before `now`.
 */
export async function runDailyReport(now = new Date()): Promise<string> {
  const stats = await collectDailyStats(now);
  const card = renderTelegramCard(stats, now, process.env.REPORT_TIMEZONE || "UTC");
  await sendTelegramHtml(card);
  try {
    await pruneOldPageViews();
  } catch (error) {
    console.error("Pruning old page views failed:", error);
  }
  return card;
}
