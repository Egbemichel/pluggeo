import type { ReactNode } from "react";
import { NavBar } from "@/components/nav-bar";
import { Footer } from "@/components/footer";
import { BagFlightProvider } from "@/components/bag-flight-provider";
import { getSearchableProducts } from "@/lib/products";

// Site-wide padding per the user's spec: 24px on mobile, 40px on desktop, on every
// storefront page — except the footer, which runs full-bleed edge to edge. Tailwind's
// own `px-6`/`md:px-10` land exactly on 24px/40px, no custom token needed.
//
// BagFlightProvider (Client Component) wraps the whole shell so any
// Add-to-Bag button anywhere in the tree can reach NavBar's bag icon
// (registered as a flight target) via context — wrapping Server-rendered
// children in a Client Component provider doesn't force those children to
// become client themselves, this is standard Next composition.
//
// `viewTransitionName: "site-header"` anchors the navbar so page-transition
// slides never move it — see globals.css for the matching CSS that
// suppresses its own view-transition group animation. It lives on NavBar's
// own <nav> element (not this wrapper div) — see nav-bar.tsx's comment for
// why: a `view-transition-name` ancestor becomes a containing block for
// `position: fixed` descendants, which broke SearchOverlay/MobileNavDrawer
// (both rendered as NavBar's siblings-in-a-fragment, so they were caught by
// it too) — their fixed overlays were confined to this div's own small box
// instead of the full viewport.
//
// `force-dynamic`: this layout wraps every storefront route including
// `/bag` (a Client Component page with no server data of its own, which Next
// would otherwise happily prerender statically) — since a plain Drizzle
// query here doesn't register as a signal Next tracks for staleness, the
// *whole* segment tree for a request only re-renders if something in it is
// marked dynamic. Without this, a newly published/renamed product could
// still be missing from search on a page Next decided to serve statically.
export const dynamic = "force-dynamic";

export default async function StorefrontLayout({ children }: { children: ReactNode }) {
  const products = await getSearchableProducts();

  return (
    <BagFlightProvider>
      <div className="flex flex-1 flex-col">
        <div className="px-6 py-(--space-7) md:px-10">
          <NavBar products={products} />
        </div>
        <main className="flex flex-1 flex-col px-6 md:px-10">{children}</main>
        <Footer className="mt-16" />
      </div>
    </BagFlightProvider>
  );
}
