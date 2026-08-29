import { ViewTransition } from "react";
import { CategoryPageContent } from "@/components/category-page-content";
import { minDelay } from "@/lib/min-delay";
import { PAGE_TRANSITION } from "@/lib/motion";

// Server Component so `params` can stay async per Next.js convention; the
// actual interactive body (pagination state) is CategoryPageContent, a
// Client Component. Tagline copy is placeholder per category — no CMS/admin
// field for it yet, see docs/ADMIN.md's category list.
const TAGLINES: Record<string, string> = {
  bracelets: "Classy and premium",
  chains: "Bold and iconic",
  pendants: "Small details, big statement",
  watches: "Timeless on your wrist",
  sets: "Matched, not mixed",
  grillz: "Custom-fit luxury",
};

function toTitleCase(slug: string) {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // `Promise.all` with a minimum delay so this route's loading.tsx gets a
  // real, visible moment instead of flashing for a frame — `params` alone
  // resolves near-instantly since there's no real data fetch behind it yet.
  const [{ slug }] = await Promise.all([params, minDelay(400)]);
  const category = toTitleCase(slug);
  const tagline = TAGLINES[slug] ?? "Handcrafted for you";

  return (
    <ViewTransition {...PAGE_TRANSITION}>
      <CategoryPageContent category={category} tagline={tagline} />
    </ViewTransition>
  );
}
