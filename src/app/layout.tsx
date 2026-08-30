import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import { SITE_NAME, SITE_TAGLINE, SITE_DESCRIPTION, SITE_URL, THEME_COLOR } from "@/lib/seo";
import "./globals.css";

// Figma font/family "body" = Inter, "heading" = Quinn (licensed, local file).
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

// Only a Bold weight file exists so far — see docs/COMPONENTS.md if more weights
// (light/regular/medium/semibold) are added later.
const quinn = localFont({
  src: "../fonts/Quinn-Bold.otf",
  variable: "--font-quinn",
  weight: "700",
  style: "normal",
  display: "swap",
});

// Root-level defaults every storefront page inherits unless it declares its
// own `metadata`/`generateMetadata` (per the seo-metadata skill, every real
// storefront page does — see each page.tsx). `metadataBase` is what lets
// every page's relative OG/canonical URLs resolve to real absolute ones.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "luxury jewelry",
    "custom grillz",
    "diamond watches",
    "gold chains",
    "jewelry sets",
    "bracelets",
    "streetwear jewelry",
    SITE_NAME,
  ],
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
};

export const viewport = {
  themeColor: THEME_COLOR,
  colorScheme: "dark" as const,
};

// Sitewide Organization + WebSite JSON-LD — a Knowledge Graph / rich-result
// signal every page should carry, not something crawlers should have to
// infer from prose. Kept minimal to what's actually true: no `sameAs` social
// links or a real `logo` URL exist yet (the site has no confirmed social
// profiles and the graphic wordmark logo isn't a clean square/social-size
// asset) — add both once real values exist rather than guessing.
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${quinn.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  );
}
