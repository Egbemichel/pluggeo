import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
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

export const metadata: Metadata = {
  title: "Plug Geo",
  description: "Luxury jewelry — watches, grills, sets, bracelets, chains.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${quinn.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  );
}
