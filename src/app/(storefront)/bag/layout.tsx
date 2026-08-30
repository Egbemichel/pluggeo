import type { Metadata } from "next";

// bag/page.tsx is a Client Component ("use client"), which can't export
// `metadata` itself — this layout exists solely to attach it. No unique
// catalog content to index here (placeholder cart, no real orders — see
// CLAUDE.md's out-of-scope note), so noindex rather than a generic title.
export const metadata: Metadata = {
  title: "My Bag",
  robots: { index: false, follow: true },
};

export default function BagLayout({ children }: { children: React.ReactNode }) {
  return children;
}
