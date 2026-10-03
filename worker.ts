// Custom Worker entry: OpenNext's generated worker handles every HTTP request, and this
// wrapper adds the Cron Trigger that sends the daily Telegram analytics card
// (schedule lives in wrangler.jsonc -> triggers.crons).
import openNextWorker from "./.open-next/worker.js";

export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from "./.open-next/worker.js";

type ScheduledCtx = { waitUntil(promise: Promise<unknown>): void };

export default {
  fetch: openNextWorker.fetch,

  async scheduled(_event: unknown, _env: unknown, ctx: ScheduledCtx) {
    // Imported lazily so the database client is only created when the cron actually
    // runs (bindings are on process.env by then), not at Worker startup.
    const { runDailyReport } = await import("./src/lib/daily-report");
    ctx.waitUntil(
      runDailyReport().catch((error) => {
        console.error("Scheduled daily report failed:", error);
      }),
    );
  },
};
