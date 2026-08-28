# Architecture

## App shape

Single Next.js (App Router, TypeScript) application. No separate backend service —
the same app serves the public storefront and the admin CMS, gated by Clerk auth on
the `/admin` route group.

## Deployment target

Cloudflare, via OpenNext (`@opennextjs/cloudflare`) targeting Cloudflare Workers.
Local dev runs standard `next dev`; `wrangler`/OpenNext build is used to validate the
Workers build before each deploy, not for day-to-day dev.

## Rendering strategy

- Storefront pages (home, grillz, category, shop, PDP): Server Components, statically
  generated or ISR'd where content is admin-curated but doesn't change per request.
  Semi-static per the product brief — prefer static/ISR over full dynamic rendering
  unless a page genuinely needs per-request data.
- Admin CMS: Server Components for data display, Server Actions for mutations
  (product create/edit/delete, image upload, homepage curation). Add a client-side
  data-fetching library (React Query) only where a specific screen needs optimistic
  updates or polling that Server Actions alone can't give cleanly — don't reach for it
  by default.

## Client-side interactivity

GSAP is the only heavy client-side dependency for motion (hero/product reveals,
transitions). The Shop page's grid/gallery layout toggle is client-side state, not a
route change. No maps, no real-time/websockets, no geo rendering — despite the project
name, there's no geospatial feature in scope.

## Route map (public site)

- `app/(storefront)/page.tsx` — Home
- `app/(storefront)/grillz/page.tsx` — Grillz (dedicated, bespoke layout)
- `app/(storefront)/category/[slug]/page.tsx` — per-category template (watches, sets,
  bracelets, chains)
- `app/(storefront)/shop/page.tsx` — Shop (grid/gallery layout toggle)
- `app/(storefront)/product/[slug]/page.tsx` — Product detail

Exact segment names may shift once real Figma frame names/slugs are confirmed.

## Directory conventions

Follow standard Next.js App Router conventions:

- `app/(storefront)/...` — public pages
- `app/admin/...` — admin CMS, wrapped in Clerk auth middleware
- `app/api/...` or colocated `actions.ts` — only where a Server Action doesn't fit
  (e.g. a sitemap route)
- `db/` — Drizzle schema and client
- `components/ui/` — shadcn/ui primitives (restyled, see COMPONENTS.md)
- `components/` — Plug Geo-specific composed components
- `lib/` — shared utilities

## Environments

- Local dev (current default — no domain yet)
- Staging (Cloudflare)
- Production (Cloudflare)

Environment-specific config lives in `.env.local` / Cloudflare environment bindings, not
hardcoded.
