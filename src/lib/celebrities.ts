import fs from "node:fs";
import path from "node:path";

// Server-only (uses `node:fs`) — never import this from a Client Component.
// Scans public/celebrity/@handle/{pictures,videos}/ at build time (Home is
// statically prerendered, so this runs during `next build`, never at
// Cloudflare Worker request time, where there's no real filesystem to read).
// Folder name (including the leading "@") becomes both the celebrity id and
// the dial label, per the user — no separate display-name mapping. A
// celebrity may have only pictures, only videos, or both; media is one flat
// ordered list (pictures first, then videos) so CelebrityShowcase's existing
// pagination logic handles any mix/count without caring which type it is.
//
// Filenames here are real exported social-media captions — spaces, emoji,
// "#", parens, unicode. `encodeURIComponent` per path segment (not a single
// encodeURI on the whole string) so every one of those characters round-trips
// correctly as a URL Next.js's static file serving can resolve, while "/"
// stays a literal path separator and "@" stays unescaped (valid in a URL
// path, matches the folder name exactly).

export type CelebMedia = { type: "image" | "video"; src: string; alt: string };
export type Celebrity = { id: string; handle: string; media: CelebMedia[] };

const CELEBRITY_DIR = path.join(process.cwd(), "public", "celebrity");
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const VIDEO_EXTENSIONS = new Set([".mp4", ".webm", ".mov"]);

function toPublicUrl(...segments: string[]) {
  return "/" + segments.map(encodeURIComponent).join("/");
}

function listMediaFiles(dir: string, extensions: Set<string>) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => extensions.has(path.extname(file).toLowerCase()))
    .sort();
}

export function getCelebrities(): Celebrity[] {
  if (!fs.existsSync(CELEBRITY_DIR)) return [];

  const handles = fs
    .readdirSync(CELEBRITY_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  return handles
    .map((handle): Celebrity => {
      const pictures = listMediaFiles(path.join(CELEBRITY_DIR, handle, "pictures"), IMAGE_EXTENSIONS);
      const videos = listMediaFiles(path.join(CELEBRITY_DIR, handle, "videos"), VIDEO_EXTENSIONS);

      const media: CelebMedia[] = [
        ...pictures.map((file): CelebMedia => ({
          type: "image",
          src: toPublicUrl("celebrity", handle, "pictures", file),
          alt: handle,
        })),
        ...videos.map((file): CelebMedia => ({
          type: "video",
          src: toPublicUrl("celebrity", handle, "videos", file),
          alt: handle,
        })),
      ];

      return { id: handle, handle, media };
    })
    .filter((celebrity) => celebrity.media.length > 0);
}
