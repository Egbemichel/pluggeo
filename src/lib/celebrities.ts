import celebritiesData from "@/data/celebrities.json";

// Deliberately a plain JSON import, not a `node:fs` scan — see
// scripts/generate-celebrities.mjs's own comment for why: `fs` access at
// render time worked in local dev/build but silently returned an empty list
// on the deployed Cloudflare Worker (no configured incremental-cache store
// means OpenNext re-executes Home's Server Component per-request inside the
// actual Worker, which has no real filesystem). A JSON import is bundled at
// build time and works identically no matter where the code executes.
// Re-run `node scripts/generate-celebrities.mjs` whenever
// public/celebrity/ changes, then commit the regenerated JSON.

export type CelebMedia = { type: "image" | "video"; src: string; alt: string };
export type Celebrity = { id: string; handle: string; media: CelebMedia[] };

export function getCelebrities(): Celebrity[] {
  return celebritiesData as Celebrity[];
}
