import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { SITE_NAME, SITE_TAGLINE, THEME_COLOR } from "@/lib/seo";

// Sitewide default social-share image — Next serves this at `/opengraph-image`
// and wires it into every page's OG/Twitter tags automatically unless a more
// specific route (e.g. `product/[slug]/opengraph-image.tsx`) overrides it.
// Same crown mark as the favicon (src/app/icon.png) for visual continuity —
// simple geometric shapes only, since Satori (what ImageResponse renders
// through) supports a subset of SVG/CSS, not the full wordmark's script font.

export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const quinnData = await readFile(
    path.join(process.cwd(), "src/fonts/Quinn-Bold.otf")
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: THEME_COLOR,
        }}
      >
        <svg width="120" height="120" viewBox="0 0 64 64" fill="none">
          <path
            d="M12 27 L20 37 L32 20 L44 37 L52 27 L52 44 L12 44 Z"
            fill="#FFFFFF"
          />
          <rect x="10" y="46" width="44" height="6" rx="2" fill="#FFFFFF" />
          <circle cx="12" cy="24" r="3.4" fill="#FFFFFF" />
          <circle cx="32" cy="17" r="3.8" fill="#FFFFFF" />
          <circle cx="52" cy="24" r="3.4" fill="#FFFFFF" />
        </svg>
        <div
          style={{
            marginTop: 36,
            fontFamily: "Quinn",
            fontSize: 84,
            color: "#FFFFFF",
            letterSpacing: -1,
          }}
        >
          {SITE_NAME}
        </div>
        <div
          style={{
            marginTop: 12,
            fontFamily: "Quinn",
            fontSize: 30,
            color: "#B8BFD1",
          }}
        >
          {SITE_TAGLINE}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Quinn", data: quinnData, style: "normal", weight: 700 }],
    }
  );
}
