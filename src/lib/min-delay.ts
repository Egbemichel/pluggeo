// Guarantees an async Server Component's real work takes at least `ms`
// before resolving, via `Promise.all([realWork, minDelay(ms)])` — used so a
// route's loading.tsx fallback actually gets seen instead of flashing for a
// single frame. Placeholder pages today resolve `params` near-instantly
// (no real data fetching yet), which made the loading state look like a
// flicker rather than a deliberate transition. Retune/remove once real data
// fetching (with its own real latency) replaces the placeholder awaits.
export function minDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
