// Regenerates src/data/celebrities.json from public/celebrity/@handle/
// {pictures,videos}/ — run this manually whenever that folder's contents
// change (`node scripts/generate-celebrities.mjs`). Deliberately NOT wired
// into the build itself: the earlier version of this logic lived in
// src/lib/celebrities.ts and ran `node:fs` at render time, which worked in
// local dev/build but silently returned an empty list on the deployed
// Cloudflare Worker — without a configured incremental-cache store, OpenNext
// re-executes Home's Server Component per-request inside the actual Worker,
// which has no real filesystem, so `fs.existsSync` on public/celebrity just
// returned false there. Generating a plain JSON file once, checked into git
// and imported as static data, removes the runtime `fs` dependency entirely
// — a JS/JSON import always works the same way regardless of where the code
// executes. See PROGRESS.md's "CelebrityShowcase" entry for the full story.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(__dirname, "..");
const CELEBRITY_DIR = path.join(REPO_ROOT, "public", "celebrity");
const OUTPUT_FILE = path.join(REPO_ROOT, "src", "data", "celebrities.json");

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const VIDEO_EXTENSIONS = new Set([".mp4", ".webm", ".mov"]);

function toPublicUrl(...segments) {
  return "/" + segments.map(encodeURIComponent).join("/");
}

function listMediaFiles(dir, extensions) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => extensions.has(path.extname(file).toLowerCase()))
    .sort();
}

function getCelebrities() {
  if (!fs.existsSync(CELEBRITY_DIR)) return [];

  const handles = fs
    .readdirSync(CELEBRITY_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  return handles
    .map((handle) => {
      const pictures = listMediaFiles(path.join(CELEBRITY_DIR, handle, "pictures"), IMAGE_EXTENSIONS);
      const videos = listMediaFiles(path.join(CELEBRITY_DIR, handle, "videos"), VIDEO_EXTENSIONS);

      const media = [
        ...pictures.map((file) => ({
          type: "image",
          src: toPublicUrl("celebrity", handle, "pictures", file),
          alt: handle,
        })),
        ...videos.map((file) => ({
          type: "video",
          src: toPublicUrl("celebrity", handle, "videos", file),
          alt: handle,
        })),
      ];

      return { id: handle, handle, media };
    })
    .filter((celebrity) => celebrity.media.length > 0);
}

const celebrities = getCelebrities();
fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(celebrities, null, 2) + "\n");
console.log(`Wrote ${celebrities.length} celebrities to ${path.relative(REPO_ROOT, OUTPUT_FILE)}`);
