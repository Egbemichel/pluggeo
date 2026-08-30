# Changelog

All notable changes to this project are documented here, following
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Investigated (batch 57 — notFound() returning HTTP 200 instead of 404)

- Root-caused, not yet fixed: any dynamic route linked from anywhere in the
  app via `next/link` (`/category/[slug]`, `/product/[slug]`) loses its
  correct 404 status when `notFound()` fires — confirmed as upstream
  Next.js 16.3.2/Turbopack behavior (Next nests the not-found UI within the
  route's existing layout instead of swapping to the global not-found
  route), not application code. See `PROGRESS.md` for the full isolation
  process and options going forward.

### Fixed (batch 56 — admin sidebar unreachable on mobile; product form UI/UX)

- The admin sidebar (Products/Categories/Homepage) was `hidden` below `md`
  with no mobile equivalent — all 3 nav items were completely unreachable on
  mobile. Added a hamburger trigger in the admin header opening a
  left-anchored sheet, built on the same `@base-ui/react/dialog` primitive
  already used elsewhere in this project.
- Product form's dense 8-field "Details" section split into `Basic info` /
  `Pricing` / `Organization`, each fieldset now a real bordered card instead
  of a plain legend line.
- Admin `Input`/`Textarea`/`Select` corner radius reduced from
  `--radius-lg` (20px) to `--radius-sm` (8px) — the only consumers of that
  radius outside their own component tree, so storefront styling is
  unaffected. Their focus transition broadened to animate border+ring
  together instead of colors only.

### Fixed (batch 55 — home-page category tiles 404ing)

- Every category tile on the home page except Grillz (`/category/bracelets`,
  `/pendants`, `/chains`, `/watches`, `/sets`) 404'd, because the
  `categories` table had zero rows while the storefront's hardcoded tiles
  assumed 6 categories existed. Fixed by creating the 6 missing category
  rows (`bracelets`/`pendants`/`chains`/`watches`/`grillz`/`sets`) — no code
  change needed, `notFound()` on a genuinely unknown slug was already
  correct, intentional behavior.
- Found, not yet fixed: every `notFound()` call in a dynamic route
  (`/category/[slug]`, `/product/[slug]`) returns HTTP 200 instead of 404
  even though the not-found UI renders correctly — see `PROGRESS.md`.

### Added (batch 54 — real Shop filters; variant-driven PDP; admin form UX; second admin)

- Shop's category/price/sort filters actually filter now — a price-range
  chip and custom min/max override each other, matching the storefront
  chevron already existing to switch between them.
- PDP's Customize section now renders real chip groups from a product's
  actual variants (grouped by attribute category — Size, Width, Gold
  Color, ...), hidden entirely for products with no variants. The admin's
  variant editor picks attribute categories from a fixed dropdown instead
  of free text, so every product's chip groups stay consistent.
- Admin product/category forms got a full UI/UX pass: auto-generated slug,
  inline per-field validation errors (shared zod schema with the server,
  so they can't drift), required-field marks, `$`-prefixed price inputs,
  proper `<fieldset>`/`<legend>` grouping, and a save confirmation on edit.
- Second admin added (`ADMIN_EMAILS`, comma-separated allowlist).
- Admin dashboard moved from `/admin` to `/pluggeo` for security — the old
  path is gone, not redirected.

### Added (batch 53 — Categories/Homepage admin; storefront off placeholder data)

- `/admin/categories` (create/edit/delete) and `/admin/homepage` (curate
  featured products + order) — the admin sidebar's last two "coming soon"
  stubs are now real.
- Entire storefront now reads real DB data instead of hardcoded placeholder
  arrays: Shop, Home, Grillz, category pages, product detail, related
  products, and search (`src/lib/products.ts`). Every one of those routes
  is `force-dynamic` — a real bug was caught where `/`, `/shop`, and
  `/grillz` had been silently statically prerendered at build time despite
  querying the DB, meaning admin changes wouldn't show up until the next
  deploy. Empty states throughout ("No products yet," `notFound()` for
  unknown slugs, sections that render nothing rather than an empty grid).

### Fixed (batch 53 — Cloudinary multi-file upload)

- Choosing more than one file in the admin's media upload widget silently
  kept only the last one — a stale-closure bug in `MediaUpload`'s upload
  handler. Fixed by switching its `onChange` to accept a React-style
  updater function.

### Fixed (batch 52 — Cloudinary credentials wired, missing client-side API key)

- Real Cloudinary credentials wired into `.env.local` and as a Cloudflare
  Worker secret (`CLOUDINARY_API_SECRET`). Found and fixed a gap from the
  original build: `next-cloudinary`'s upload widget needs
  `NEXT_PUBLIC_CLOUDINARY_API_KEY` client-side, not the non-public
  `CLOUDINARY_API_KEY` that existed before — renamed throughout. `deploy.yml`
  now inlines both `NEXT_PUBLIC_CLOUDINARY_*` vars at build time. Still
  needs two GitHub Actions repo secrets added manually (cloud name, API
  key) before the next deploy has them.

### Fixed (batch 51 — CI deploy failure + celebrity dial click accuracy)

- `deploy.yml`'s `Build and deploy` step was missing `DATABASE_URL`, causing
  the previous push (admin CRUD) to fail CI outright — `next build` still
  evaluates every route module, dynamic ones included, during page-data
  collection, which trips `db/index.ts`'s eager "not configured" throw. Added
  `DATABASE_URL` to that step's env, reproduced and confirmed the fix
  locally.
- Mobile celebrity dial: clicking a pill could select a different,
  overlapping neighbor instead — a fixed 46px offset between pills didn't
  account for real celebrity handles varying from ~90px to ~183px wide.
  `CategoryDial`'s horizontal branch now measures each pill's real width and
  spaces neighbors from an overlap budget instead of a fixed step, so the
  visually topmost pill is always the one that's actually clickable.

### Added (batch 50 — admin product CRUD with Cloudinary image/video upload)

- Real admin dashboard shell (`src/app/admin/layout.tsx` +
  `src/components/admin/admin-sidebar.tsx`), pattern-ported from
  `Kiranism/next-shadcn-dashboard-starter` and restyled to Plug Geo's dark
  tokens — Products is live, Categories/Homepage are stubbed "coming soon."
- Full product CRUD: list (`/admin/products`, real Drizzle query, thumbnail/
  status/featured columns, edit/publish-toggle/delete row menu), create/edit
  form (`/admin/products/new`, `/admin/products/[id]/edit`) covering name,
  slug, description, price, compare-at price, category, status, featured,
  media, and a repeatable variant editor (label + flexible key/value
  attributes + price override + availability).
- Media upload wired to **Cloudinary**, not Cloudflare R2 — swapped mid-plan
  per the user, since R2's free tier requires a card on file and
  Cloudinary's doesn't. Signed direct upload via `next-cloudinary`'s
  `CldUploadWidget`, a new signing Route Handler
  (`src/app/api/cloudinary-sign/route.ts`), and `src/lib/cloudinary.ts`.
- `db/schema.ts`'s `product_images` table renamed to `product_media` with a
  new `type` (image/video) column, since the admin now uploads both.
- `src/lib/admin-auth.ts` split into `getAdminUser()` (non-redirecting, for
  Server Actions/Route Handlers) and `requireAdmin()` (redirecting, for
  page/layout guards).
- See `docs/ADMIN.md`/`docs/DATABASE.md` for the full shape. `tsc`/lint/
  `next build`/`vitest` all clean.

### Fixed (batch 49 — SearchOverlay gets its own close animation + nav fix)

- `SearchOverlay` had no exit animation at all and clicking a search result
  navigated away without ever closing it, leaving it floating over the
  destination page. Gave it its own fade+slide open/close (a centered
  top-anchored dropdown, not reusing the drawer's side-slide) and deferred
  result-click navigation until the close animation finishes — same fix
  shape as `MobileNavDrawer`'s, extracted the shared "mount lags open"
  bookkeeping into a new `useLaggedMount` hook so both use it. Verified the
  overlay closes before the destination URL changes, and that Escape/
  backdrop/X-button close all still work.

### Fixed (batch 48 — dial UX, drawer/page-transition race, loading states)

- **Dials**: removed the "stadium wave" hover/swipe scale animation from
  `useDialWave` entirely, per the user — it was fighting for the same
  elements' `transform` as the coverflow's own instant (untransitioned)
  resize-on-click, reading as jumpy and hard to control, especially on
  longer lists (the 8 celebrity handles) where most items already collapse
  to the same minimum coverflow size. Kept the functional part (touch
  swipe-and-release-to-select); `CategoryDial`/`PaginationDial` both gained
  a plain CSS transition on the properties that used to snap instantly, so
  clicking through either dial now resizes smoothly regardless.
- **Cross-overlay navigation race**: clicking a link inside the open mobile
  nav drawer used to start the drawer's close animation and the page
  transition at the same time — the browser's View Transition renders in
  the top layer (always above regular content, any z-index), so the
  incoming page would visibly paint over the still-closing drawer
  underneath it. Fixed by deferring the actual navigation until the
  drawer's close animation genuinely finishes (`useDrawerTransition` gained
  an `onClosed` callback); verified via Playwright that the drawer
  disappears before the URL changes, not after.
- **Loading states**: `product/[slug]`/`category/[slug]` resolved their
  (currently placeholder, near-instant) data in single-digit milliseconds,
  making their loading fallback flash rather than show — both now enforce a
  400ms minimum via a new `minDelay()` helper. Added `/bag/loading.tsx`,
  which previously had none.

### Fixed (batch 47 — CelebrityShowcase vanished live; reviews had no mobile nav)

- **CelebrityShowcase disappeared entirely on the deployed site** — batch
  46's `node:fs`-based scan worked in local dev/build but silently returned
  an empty celebrity list on the actual Cloudflare Worker: with no
  incremental-cache store bound, OpenNext re-executes Home's Server
  Component per request inside the Worker, which has no real filesystem.
  Fixed by moving the scan to a manual build-time script
  (`scripts/generate-celebrities.mjs`, run whenever `public/celebrity/`
  changes) that writes `src/data/celebrities.json`; `src/lib/celebrities.ts`
  now just imports that as static data — bundled at build time, works
  identically regardless of runtime environment, no more `node:fs` on the
  request path at all.
- **Reviews ("What our customers say") had no way to page through it on
  mobile** — `SectionHeader`'s chevron nav is desktop-only by design;
  `TestimonialSection` never rendered the mobile-specific
  `SectionCarouselNav` companion (pre-existing gap, not something this
  session's earlier edits to that file introduced). Added it, matching the
  exact pattern `CelebrityShowcase` already uses for its own mobile pager.

### Added (batch 46 — CelebrityShowcase runs on real media)

- New `src/lib/celebrities.ts` (`getCelebrities()`, server-only) scans
  `public/celebrity/@handle/{pictures,videos}/` and returns typed data;
  called from Home's `page.tsx` and passed into `CelebrityShowcase` as a
  prop, replacing the hardcoded placeholder celebrity list entirely. Folder
  name (with the `@`) is both the celebrity id and the dial label.
- Handles every real combination present in the provided folders gracefully:
  pictures-only, videos-only (1 or more), both, and — a real gap this
  surfaced — exactly 1 total item, which previously would've sat lopsided
  in a 2-column grid; that case now centers in a single column instead.
- Video tiles are real `<video loop playsInline>` elements: sound-on
  autoplay is attempted first, falling back to muted only if the browser
  blocks it, gated behind the tile's own viewport visibility so nothing
  plays audio before it's scrolled into view. Custom Hugeicons overlay
  controls (play/pause, mute/unmute) replace the old static play-icon
  treatment; no native `<video controls>`.
- Verified with real `next build` (confirmed celebrity ids present in the
  prerendered static HTML) and live Playwright checks: correct media counts
  per celebrity, zero bad HTTP responses across all 8 celebrities' assets
  (filenames have spaces/emoji/`#`/parens — encoded per path segment), and
  direct `<video>` element state checks proving both custom controls
  actually work.

### Fixed (batch 45 — CI: wrangler needs Node 22, not 20)

- First real Actions run failed at deploy with "Wrangler requires at least
  Node.js v22.0.0" — `deploy.yml` had been pinned to Node 20 based on a
  wrong signal (`@types/node`'s version, not an actual engine requirement).
  Bumped to Node 22. Also documented inline in `src/middleware.ts` why the
  build's "middleware is deprecated, use proxy" warning is intentional to
  ignore here, so it doesn't get "fixed" later and silently re-break
  Cloudflare deploys.

### Added (batch 44 — real photography: categories + reviews)

- `CategoryCollage` now uses real category photography
  (`public/assets/categories/<id>.png`) instead of the placeholder icon —
  full-bleed `object-cover` instead of the placeholder's centered
  `object-contain`. `CategoryTile` gained a required `image` field.
- `TestimonialSection` ("What our customers say") now uses 4 real reviewer
  photos (`public/assets/reviews/1-4.png`); trimmed from 5 placeholder
  entries to 4 to match. Names/quotes/ratings unchanged — no real reviewer
  text was provided, only photos.

### Added (batch 43 — live deployment: Cloudflare Workers + real Neon DB + CI)

- The app is live: https://pluggeo.egbemichel39.workers.dev. Created real
  Cloudflare and Neon accounts/projects (neither existed before), applied the
  existing Drizzle schema to the new database (`npm run db:migrate`), set
  `DATABASE_URL`/`CLERK_SECRET_KEY`/`ADMIN_EMAIL` as Cloudflare Worker
  secrets, and added the account ID to `wrangler.jsonc`.
- Added `.github/workflows/deploy.yml` — runs DB migrations then builds and
  deploys to Cloudflare on every push to `main`, so every prompt's work goes
  live automatically once the required repo secrets are added (see
  `PROGRESS.md`'s Flagged section — not yet added as of this entry, so the
  workflow will fail until then).
- Renamed `src/proxy.ts` back to `src/middleware.ts` (same Clerk middleware,
  unchanged otherwise) — Next.js 16's `proxy.ts` convention is hard-locked to
  the Node.js runtime with no way to opt back into Edge, and
  `@opennextjs/cloudflare` refuses to build any Node.js-runtime middleware at
  all. Next's own docs name `middleware.ts` as the explicit way to keep Edge
  runtime, which is what Cloudflare Workers deployment requires here.
- `eslint.config.mjs` now ignores `.open-next/**` (OpenNext's generated,
  gitignored build output) — it had never existed on disk before the first
  Cloudflare build, so lint had never actually been run against it until this
  pass surfaced ~400 errors from generated code.

### Fixed (batch 42 — app-wide z-index sweep: overlays now portal to `<body>`)

- Per the user, after batch 41's PDP-specific fix: found and fixed the whole
  class of bug, not just the one instance. Audited every real
  `position: fixed` element in the app (4 total: `SearchOverlay`,
  `MobileNavDrawer`, `MobileFilterDrawer`, `BagFlightProvider`'s flying icon)
  and portaled the three full-viewport overlay components straight to
  `document.body` via `createPortal`. This removes the DOM ancestor chain
  between each overlay and the viewport entirely, so no future ancestor
  (a `transform`/`filter`/`view-transition-name` — GSAP's reveal animations
  leave inline `transform`s behind permanently, and every page's
  `<ViewTransition>` can do the same) can ever trap them again — the bug
  class is now structurally impossible, not patched one occurrence at a
  time. `BagFlightProvider`'s flying icon was confirmed unaffected (it's a
  layout-level sibling of `<main>`, never nested under a `<ViewTransition>`)
  and left as-is. Re-verified via Playwright across all 6 storefront routes
  at both breakpoints post-change — all three overlays span the full
  viewport everywhere, and the filter drawer's node is confirmed as a real
  direct child of `<body>` in the DOM.

### Fixed (batch 41 — SearchOverlay/MobileNavDrawer rendering under page content)

- `SearchOverlay` and `MobileNavDrawer` (both `fixed inset-0` full-screen
  overlays, rendered as NavBar's siblings) were getting rendered *behind*
  page content instead of on top of it, most visibly on the PDP. Root cause:
  batch 40's page-transition anchoring (`viewTransitionName: "site-header"`)
  was set on NavBar's *wrapper div* in `StorefrontLayout`, an ancestor of
  those overlays — a `view-transition-name` ancestor becomes a containing
  block for `position: fixed` descendants, so both overlays were confined to
  that small wrapper box instead of spanning the viewport. Fixed by moving
  the anchoring onto NavBar's own `<nav>` element (not an ancestor of the
  overlays) instead of the layout wrapper — the navbar keeps its
  page-transition anchoring, the overlays render on top everywhere again.

### Added (batch 40 — site-wide animation & micro-interaction system)

- Built a full, systemic animation pass across the storefront from a written
  spec, so the app reads as one premium, intentional motion system instead of
  ad-hoc effects. Shared infrastructure: `lib/motion.ts` (one set of ease/
  duration/stagger tokens reused everywhere), `useViewportEnter`/`useReveal`/
  `RevealText` (viewport-gated, run-once entrances built on one shared
  `IntersectionObserver` primitive), `useDialWave` (the "stadium wave" hover/
  swipe interaction, now shared by every `CategoryDial`/`PaginationDial`
  instance site-wide), `useDrawerTransition` (mirror-image slide+stagger
  open/close for mobile drawers), `useAccordion` (shared dropdown/disclosure
  open-close), `useTogglePulse` (toggle-button state-change confirmation).
- Native page transitions via React's `<ViewTransition>` (zero-config in
  Next.js 16.3.2's App Router) — forward/back navigation slides the old page
  out and the new one in from the opposite edge, both visible mid-transition;
  untyped navigation (browser back/forward, `router.back()`) falls back to a
  plain crossfade instead of a hard cut.
- Chrome-download-style flying Add-to-Bag icon (`BagFlightProvider` +
  `AddToBagButton`) — clicking any "Add to bag" control site-wide (previously
  unwired everywhere) now flies a real icon to the navbar bag/hamburger,
  badge increments exactly on arrival.
- Viewport-gated entrance builds: Hero's desktop collage assembles from
  per-image directions, mobile's carousel swipes itself in on load;
  Categories' desktop bento tiles assemble from position-matched directions,
  mobile "stacks like bricks" over the existing layout; every `SectionHeader`
  title/subtitle (and `CopyBlock` heading) now word-staggers in via
  `RevealText`; Celebrity media tiles fade in right-to-left; PDP's fields
  (category → name → details → quantity → Add to bag → Customize) stagger in
  top-to-bottom; Search results fade in top-to-bottom as they populate.
- `ProductCustomize`'s "Customize" dropdown and `PriceFilterPanel`'s "Custom
  price" disclosure now have real open/close animations (previously an
  instant conditional-render toggle with no exit state at all).
  `MobileNavDrawer`/`MobileFilterDrawer` retrofitted with a real mirror-image
  open (panel slides in, then items stagger-fade-in) / close (items
  stagger-fade-out first, then the panel slides out) instead of an instant
  mount/unmount.
- `SortToggle`/`LayoutToggle` get a snappy scale-punch confirmation on the
  newly-active option; a new global CSS rule gives every bare icon button
  (chevrons, close/cancel, search) a restrained hover/press scale.
- Everything is gated behind `prefers-reduced-motion` via the existing
  `gsap.matchMedia()` convention (a plain, fast opacity fade replaces the
  full motion, functional state like badge counts/drawer open-state always
  updates regardless).
- Full verification gate clean (`tsc`, lint, `next build`, `vitest`); found
  one **pre-existing** `e2e/home.spec.ts` failure unrelated to this work (see
  `PROGRESS.md`) while running the Playwright suite as part of the gate.

### Changed (batch 39 — ProductSpotlight image sizing, row-hover reverted)

- `ProductCard`'s "row" layout (the product list under Shop's
  ProductSpotlight) no longer scales up on hover — per the user, it just
  keeps the default subtle fade like every other clickable element. The
  "card" layout (grid tiles) is unaffected.
- `ProductSpotlight`'s coverflow images bumped up per the user (they read
  "sooo small"): 3x on mobile, 4x on desktop, with two real constraints
  discovered and handled during verification rather than shipped literally:
  (1) the literal sizes overflowed the viewport horizontally (316px of
  page-scroll on mobile, uncapped) — capped against the coverflow
  container's actual measured width (`ResizeObserver`) instead of a fixed
  breakpoint value. (2) `ProductSpotlight` is `sticky`, and the literal 4x
  size measured ~930px tall — tall enough to fully cover the product list
  rows beneath it while pinned (confirmed via `elementFromPoint` at a row's
  center resolving to the spotlight's own elements, not the row — those
  rows were genuinely unclickable, not just visually crowded). Per the
  user's explicit choice (asked directly given the trade-off): capped
  against 70% of viewport height for the *whole* sticky block rather than
  dropping `sticky` or shipping the literal size, verified under natural
  incremental scrolling to confirm at least one substantially-visible row
  remains on screen at every scroll position, not just checked once.
  Net result: real, visible size increase (roughly 1.5x the original on a
  typical viewport) without breaking horizontal layout or the list's
  usability while the spotlight is pinned.

### Added (batch 38 — app-wide hover feedback)

- Every clickable element (buttons, links, `[role="button"]`) now gets a
  subtle opacity fade on hover, per the user — one `@layer base` rule in
  `globals.css` (same pattern as the existing `cursor: pointer` rule)
  instead of a `hover:` utility on every component individually. Wrapped in
  `(hover: hover)` so a tap on a touchscreen doesn't leave an element stuck
  faded. Tailwind's own `hover:` utilities on a specific component always
  win over this base rule regardless of specificity (that's what `@layer`
  ordering guarantees), so anything needing different behavior just adds
  its own `hover:` class.
- `ProductCard` (both "card" and "row" layouts) scales up on hover instead
  of the default fade, per the user — `hover:scale-105 hover:z-10` on the
  outer `<article>`, with `hover:opacity-100` on its inner Links to cancel
  the global fade so hovering a card only scales it, nothing else.
- Root-caused a false "the animation isn't working" investigation along the
  way: an intermediate edit made with `sed -i` (via the Bash tool) never
  triggered the dev server's file-watcher/HMR, so the compiled CSS didn't
  contain the new class at all — using the Edit tool for the same change
  compiled and worked immediately. Worth remembering: prefer the Edit tool
  over shell text-editing commands for source files the dev server needs to
  hot-reload.

### Changed (batch 37 — spinner rebuilt, skeleton loading states, /bag navbar fix)

- `Spinner` rebuilt per the user: previously the whole 5-bar graphic spun as
  one unit (`animate-spin`); now each bar bounces independently — scaling
  from its own bottom edge with a springy `elastic.out` ease, staggered so
  adjacent bars are visibly out of phase (piano-key/accordion effect), via
  GSAP (`gsap.matchMedia`-gated behind `prefers-reduced-motion`, same
  pattern as `TestimonialSection`). This is the app-wide loading indicator
  for anything that isn't a grid of product cards.
  - Verified the animation actually runs (not just compiles) via an
    isolated throwaway test route sampling each bar's live transform over
    time — GSAP animates SVG rects through the `transform` *attribute*
    (matrix form), not inline CSS, which is worth knowing if this component
    is ever touched again: checking `el.style.transform` looks static even
    while it's animating.
- Added `ProductCardSkeleton`/`ProductGridSkeleton`
  (`src/components/ui/product-card-skeleton.tsx`) — shimmer placeholder
  shaped to match `ProductCard`'s card layout and `ProductGrid`'s grid
  classes exactly, per the user: product-card loading states use a
  skeleton, not the spinner, everywhere.
- Added `loading.tsx` for the two route segments that are genuinely async
  Server Components (`await params`): `/category/[slug]` (full
  `ProductGridSkeleton`-based layout mirroring the real page's two grids)
  and `/product/[slug]` (centered `Spinner` — the PDP isn't a grid of
  product cards, so it gets the spinner per the user's split). `/shop` and
  `/bag` do no server-side async work (both fully client-rendered with
  local state), so Next's `loading.tsx` mechanism has nothing to bridge
  there — skipped rather than added for form's sake.
- Fixed `NavBar`'s `/bag` back-button matching: it was
  `pathname.startsWith("/bag/")` (trailing slash), which never actually
  matched the real `/bag` page — corrected to an exact match, same as
  `/grillz`. Confirmed by the user: `/bag` gets the same back-button navbar
  treatment as `/grillz` and `/product/*`.
- Removed a stray, unused `import path from "path"` from `nav-bar.tsx` (a
  Node built-in with no place in client-side code) that had landed in the
  file outside of an intentional edit.

### Added (batch 36 — shopping bag page)

- Added `/bag` ("My shopping bag"), built from a pasted screenshot. Both nav
  basket icons (desktop NavBar, MobileNavDrawer) now point at `/bag` instead
  of the never-built `/cart`, per the user. Generalized `SearchResultCard`
  into a shared `ProductLineItemCard` (`src/components/product-line-item-card.tsx`)
  — same image/title/category/variant-summary/price row, now parameterized
  by a trailing `action` (label + icon + onClick) instead of a hardcoded
  "Add to bag" pill, so the search overlay uses "Add to bag" and the bag page
  uses "Remove". `QuantityStepper` became a controlled/uncontrolled dual-mode
  component (`value`/`onChange` optional) so the bag page can read each
  line's quantity for its subtotal while the search overlay and PDP keep
  their old self-contained decorative behavior.
- **Scope note**: quantity/remove genuinely work and the subtotal
  recalculates live, but this is a visual page over local component state
  seeded with placeholder data — no cart table, persistence, or real
  "Add to bag" wiring from anywhere else in the app, and "Checkout" is inert.
  Checkout/cart/orders/payments remain explicitly out of scope per
  `CLAUDE.md`/`docs/PROJECT.md`; this page doesn't cross that line.

### Changed (batch 35 — QuantityStepper on desktop + PDP)

- `QuantityStepper` (SearchResultCard's mobile-only quantity control) now
  also shows on desktop search results, and was added to the PDP directly
  above "Add to bag" — both per the user. Extracted out of
  `search-result-card.tsx` into a shared `src/components/ui/quantity-stepper.tsx`
  now that it's used in two places.

### Added (batch 34 — search overlay)

- Wired up the previously-inert search icon (desktop NavBar and
  MobileNavDrawer both just had a plain `aria-label="Search"` button with no
  behavior) to a new `SearchOverlay`: a dismissible panel (backdrop click +
  Escape, same pattern as `MobileNavDrawer`) with `SearchInput` at the top and
  a list of `SearchResultCard` results below, built from a pasted screenshot.
  Each result shows image/title/category, a Size/Width and Gold
  color/Gold type summary line, price, and an "Add to bag" control — a
  quantity stepper plus the add-to-bag pill on mobile, just the pill on
  desktop. No real search backend/catalog query exists yet — typing anything
  shows the same placeholder result set.
- Fixed a real mobile layout bug found while verifying: the CTA block
  (stepper + pill) doesn't shrink, and as a side-by-side sibling of the
  image+text on a 375px viewport it starved the text column down to a few
  px, causing word-by-word wrapping and the price/button visually
  overlapping. Fixed by giving the CTA block its own full-width row below
  the image+text on mobile (`flex-col`) instead of squeezing beside it;
  desktop keeps the side-by-side placement from the reference, where there's
  actually room for it.

### Added (batch 33 — PDP Related Pieces section)

- Added the PDP's second section, "More From The Plug" — a related-products
  grid (4-col desktop / 2-col mobile, same responsive split every other
  product grid on the site uses) plus an "Explore more" CTA (full-width on
  mobile, self-sizing on desktop), built from a pasted screenshot. Header
  copy was rewritten in Plug Geo's own voice instead of reusing the
  reference's generic placeholder wording. Placeholder product data — no
  real related-products/recommendation query yet.

### Added (batch 32 — PDP Customize/variant section)

- Added a "Customize ⌄" section under the PDP's "Add to bag" button: a
  collapsible Size/Width/Gold color/Gold type variant selector, built from a
  pasted screenshot. Reuses `Pill` (already flagged as used for
  variant-selection chips) for every option, the same collapse/rotate-chevron
  pattern `PriceFilterPanel`'s "Custom price" disclosure already established,
  and `Divider`'s vertical self-stretch fallback to separate the Width/Gold
  color/Gold type groups without a hardcoded height. Placeholder options only
  (no real variant/inventory data model yet).

### Changed (batch 31 — PDP description copy)

- Replaced the PDP's lorem ipsum placeholder with 6 real, on-brand copy
  blocks, picked deterministically per slug (a simple char-code hash) so
  different products read as genuinely different rather than one repeated
  paragraph. Still placeholder content — no real per-product description
  field exists yet — but no longer lorem ipsum.

### Added (batch 30 — PDP first section)

- Built the first section of `/product/[slug]` from pasted desktop+mobile
  screenshots: an image gallery beside category/title/price/description/
  "Add to bag". Rebuilt `ImageThumbnail` (previously unused anywhere in the
  app) to match — one shared card frame around a landscape main image with 3
  thumbnails in a tight row below, instead of two separate blocks with wide
  gaps. "Add to bag" reuses `ProductSpotlight`'s exact button rather than a
  new design, per the user. `NavBar`'s back-button variant now also covers
  `/product/*`. Every product currently points at the same placeholder data
  (no real per-slug catalog query yet).

### Added (batch 29 — generic `/category/[slug]` page)

- Built the per-category page template from a filled Bracelets Figma
  reference, entirely from existing components per the user ("every single
  component already exists just load them in"): `SectionHeader` + responsive
  `ProductGrid` + pagination dial + a "More from us" grid + an "Explore more"
  button, all placeholder data. `NavBar`'s back-button variant (previously
  Grillz-only) now also applies to any `/category/*` route, while the
  Grillz-only top-hero-image bleed stays scoped to `/grillz` via a separate
  flag. Verified at both breakpoints with 0px horizontal overflow, full build
  and test suite clean.

### Changed (batch 28 — Grillz mobile hamburger restored)

- The mobile hamburger, previously hidden on `/grillz`, is back — it now
  shows alongside the back button. Its drawer still skips Home/Shop on that
  route (an empty `links` array from `NavBar`), showing only search/basket.

### Added (batch 27 — MobileNavDrawer search/basket icons)

- `MobileNavDrawer` had no way to search or view the basket — added both
  below the nav links, stacked (search first, then basket), at 3x NavBar's
  desktop icon size (24px → 72px). Basket count badge wired through from
  `NavBar`'s own `basketCount` prop, matching the desktop nav's behavior.

### Fixed (batch 26 — GrillzCastSection button size)

- `GrillzCastSection`'s "Shop now"/"Explore more" buttons were using
  `Button`'s small default size, reading too small and too rounded — now
  match `GrillzHeroSection`'s own button exactly (`height={64} textSize={28}`).

### Added (batch 25 — Grillz page: collection + closing cast section)

- Added `ProductCollectionSection` ("Best Grillz Collection") and a new
  `GrillzCastSection` (real cast photos, copy, "Shop now"/"Explore more") as
  the last section before the Footer.
- Extracted `CategoryCollage`'s local copy-block pattern into a shared
  `CopyBlock` (`src/components/ui/copy-block.tsx`) — both sections use it now
  instead of duplicating the markup.

### Added (batch 24 — Grillz page hero)

- Built the Grillz page hero (previously a stub): full-bleed top/bottom grill
  images (real transparent PNGs from the user), headline, "Shop now" CTA, and
  a tagline row (reusing `SectionHeader`). The top image renders *above* the
  shared NavBar — `NavBar` itself (pathname-aware) prepends it before its own
  `<nav>` only on `/grillz`, since page content can never actually render
  before the navbar from inside `<main>`.
- Grillz hides the normal desktop nav links and mobile hamburger entirely —
  the new back button is that page's only way out, not an addition alongside
  them.
- Added `BackButton` (`src/components/ui/back-button.tsx`), styled like
  `BackToTopButton` — both now share a new `GlassIconButton` shell instead of
  duplicating styles. `NavBar` renders it in place of the previously-empty
  first grid cell, only on `/grillz`; it calls `router.back()`.

### Changed (batch 23 — ProductList row width)

- `ProductCard`'s row layout is now inset from both edges instead of spanning
  the full content width: 18px per side on mobile, 49px per side on desktop
  (`w-[calc(100%-36px)] md:w-[calc(100%-98px)]`, centered via `mx-auto`).

### Changed (batch 22 — ProductSpotlight button placement)

- `ProductSpotlight`'s Details/Add-to-bag column moved back to the far right
  of the component (`justify-between`, full width) instead of sitting close
  beside the info text, per the user.

### Fixed (batch 21 — ProductSpotlight follow-up)

- Removed `ProductSpotlight`'s `max-w-md` cap, which left it packed at the
  left edge of the wider desktop content column with a lot of dead space —
  now `w-full`, with the coverflow centered and the info row sized to its own
  content instead of stretched full-width.
- Fixed the spotlight's image index not resetting when a different product is
  selected — a stale index from the previous product could exceed the new
  one's image count (blank coverflow) or just violate "center image shown
  first." Fixed via `key={product.href}`, forcing a fresh instance per product.
- Fixed two sticky-positioning bugs: a `top-10` gap let scrolled-out list rows
  peek through above the pinned spotlight (now `top-0`), and the sticky
  container previously spanned the whole content column (including the
  pagination dial), causing a visual collision with it — now scoped to just
  [spotlight+divider, list] so it releases right as the list ends.

### Added (batch 20 — ProductSpotlight for Shop's list layout)

- Built `ProductSpotlight` (Figma node 596:600, "imageGallery") — a featured
  section above Shop's list/gallery rows showing the selected product's photos
  as a coverflow (active large/sharp/centered, neighbors smaller/blurred),
  chevrons on desktop, swipe on mobile, and a dot indicator for count/position.
  `products[0]` auto-selects on open; clicking any row below re-selects it
  instead of navigating to the PDP (`ProductCard`'s row layout gained an
  `onSelect`/`selected` prop pair for this). Spotlight + a divider under it are
  sticky together so scrolling the list never scrolls them out of view.

### Fixed (batch 20 continued — real horizontal-overflow bugs)

- `ProductCard`'s row layout was missing `min-w-0` on its `flex-1` content
  wrapper (card layout already had it) — an unbreakable price string forced
  the entire Shop content column wider than the mobile viewport. Added
  `min-w-0` there and to the shared `ProductInfo`.
- `ProductSpotlight`'s price row had `whitespace-nowrap` without the matching
  `flex-wrap` fallback `ProductCard`'s price row has — same bug, same fix.
- `ShopControlsBar` didn't actually fit Sort/Filter/Layout in the mobile width
  budget after the previous batch's Filter trigger — tightened mobile-only gaps.
- `ProductSpotlight`'s coverflow neighbor tile spilled a few px past its
  container — tightened its size/offset constants.
- Net effect of the above four: 55px → 0px of measured mobile horizontal
  overflow on the Shop page.

### Added (batch 19 — Shop mobile filtering + sidebar layout)

- Added a mobile filter drawer for the Shop page: a new "Filter" trigger in
  `ShopControlsBar` (icon fills when a price filter is active) opens
  `MobileFilterDrawer`, which shares the exact same price-filter state and UI
  (`PriceFilterPanel`) as the desktop sidebar — mobile previously had no way to
  filter at all.
- Desktop Shop sidebar is now `sticky` (stays in view while the grid/list
  scrolls) with a vertical divider separating it from the product content, for
  both layouts.

### Fixed (batch 19 continued — Divider/Icon bugs surfaced by the above)

- `Divider`'s vertical orientation with `length` omitted defaulted to a
  percentage height that didn't reliably resolve against an auto-height flex
  container (rendered at 0 height) — fixed via `align-self: stretch` instead.
- `Icon` gained an optional `fill` prop (only applied when explicitly set) so
  icons with closed sub-paths can render "filled" without a solid icon variant.

### Changed (batch 18 — Shop page grid + mobile pagination)

- Shop page's product grid is now responsive: 4 columns on desktop, 2 on mobile
  (was 2 everywhere).
- Mobile pagination (both grid and gallery/list layout) now uses `CategoryDial`'s
  horizontal z-axis coverflow with page numbers, matching `CelebrityShowcase`'s
  mobile picker; desktop keeps the original flat `PaginationDial` for both.

### Fixed (batch 17 — nav/button/testimonial QA pass + a real tailwind-merge bug)

- Root-caused a `tailwind-merge` misconfiguration: `cn()` didn't know this
  project's custom `text-*` size scale, so combining a size class with a color
  class (e.g. `text-display` + `text-brand-primary`) silently dropped the size
  class as a false "conflict." Fixed via `extendTailwindMerge` in `lib/utils.ts`.
  Any earlier size fix applied through `cn()` may have silently not taken effect.
- Fixed `NavBar`'s active-link state, which was hardcoded to `"/"` — now derived
  from `usePathname()`.
- NavBar/MobileNavDrawer link text bumped to `text-display` (96px) per request.
- `Button`'s horizontal padding is now 4x the original (24px vs 6px), vertical
  unchanged — added `paddingX`/`paddingY` props.
- `TestimonialSection` rebuilt from scratch to match a real Figma screenshot:
  a filmstrip of different testimonials' photos (previous peeking in cropped,
  active one large and central, next one or two smaller) instead of one
  testimonial's hero + supporting photos. Chevron clicks now animate a genuine
  shared-element transition via GSAP Flip (old hero shrinks/slides to a
  thumbnail slot, the clicked neighbor grows/slides into the hero slot) instead
  of an in-place scale-pulse.
- Star ratings now actually render filled vs empty (Hugeicons' free StarIcon is
  stroke-only with no fill variant — replaced with an inline SVG that toggles
  fill directly).
- Back-to-top button now reliably reaches scroll-0 on mobile (was undershooting
  due to mobile browsers' dynamic address bar resizing the viewport mid-scroll).
- Footer's chain image now actually bleeds out over the card's top edge, per
  Figma — the card's `overflow-hidden` was silently clipping it.
- Every clickable element now shows `cursor: pointer` on hover (one global
  `@layer base` rule; Tailwind v4 doesn't set this on `<button>` by default).

### Fixed (batch 16 — CelebrityShowcase mobile dial rebuilt as a real coverflow)

- `CategoryDial`'s mobile horizontal orientation rebuilt from a flat scrolling
  chip row into a depth-stacked coverflow, per the user: active item centered
  and frontmost at full size, each neighbor sitting behind the one closer to
  center (overlapping, descending z-index), shrinking/blurring with distance,
  clipped so only the near half of items 2+ steps out is visible. Took two wrong
  attempts first (over-large active item filling the whole card; then a literal
  2D arc/rotate misreading of "z-axis") before landing on the right shape.
- The mobile media-pager chevron under `CelebrityShowcase`'s `MediaTile` grid no
  longer disappears entirely when the selected celebrity has ≤2 media items —
  it now stays visible with the inapplicable direction disabled
  (`SectionCarouselNav` gained an opt-in `forceVisible` prop).
- Note: batch 15's `.font-heading` font-kerning fix has been removed — the user
  says kerning wasn't the actual cause of the overlapping-glyph symptom and took
  it out themselves. That symptom's real fix is still open.

### Fixed (batch 15 — third QA pass: font-kerning root cause + horizontal overflow)

- Root-caused the "overlapping text" reports from the previous two QA passes:
  `Quinn-Bold.otf`'s kern table produces overlapping glyphs for specific letter
  pairs at every size (visible in large headlines too, not just small labels) —
  fixed globally via `font-kerning: none` / disabled ligatures on `.font-heading`.
  Confirmed by screenshotting the real rendered page with Playwright rather than
  reasoning from code.
- Fixed a real bug in `CategoryDial`'s horizontal orientation (the mobile
  celebrity-handle picker): the row had no width constraint and overflowed the
  entire page (~1475px of horizontal page-scroll on a 375px viewport) — now
  scrolls within its own `overflow-x-auto` strip.
- `ProductCard`/`ProductGrid` mobile spacing tightened (grid gap and card padding
  both reduced below `md`) and the price row now wraps as a whole unit instead of
  breaking mid-string or (a regression caught mid-fix) overflowing into the
  basket icon on desktop.
- Playwright's Chromium browser is now installed locally for this kind of visual
  verification going forward.

### Fixed (batch 14 — second QA pass: ProductCard/CategoryCollage)

- `ProductCard`'s "card" layout had `AddToBasketButton` absolutely pinned to the
  bottom-right corner with no matching padding on the info block, leaving a large
  dead gap between the price and the card edge — rewritten as a flex row
  (`items-end justify-between`) so the button sits beside the price and the card
  hugs its content, matching the Figma reference.
- `ProductCard`'s corner radius is now responsive: 8px on mobile, 16px on desktop
  (16px read oversized on the narrow mobile card).
- `ProductCard`'s category label shrinks to 20px below `md` (was a fixed 32px that
  overflowed/wrapped on a narrow mobile card).
- `CategoryCollage` tile label bumped 16px→28px (`text-h6`→`text-h4`) — a real
  screenshot showed it clearly larger than the original guess.

### Fixed (batch 13 — first QA pass on Home)

- Hero/Footer "Shop now" buttons were built with the real measured Figma values
  documented in code but never applied at the call site — fixed (Hero: 458×110/
  70px fixed; Footer: `clamp()`-scaled text since that card resizes responsively).
- NavBar/MobileNavDrawer link text bumped 28px→48px per an explicit accessibility
  request (deliberately larger than Figma's own measured value, not a fidelity fix).
- "Buy once, wear forever" headline and `SectionHeader`'s `title` bumped 30px→48px
  — a real screenshot showed the original (rate-limited, guessed) size was too
  small.
- `SectionHeader`'s "View all" button text bumped 16px→22px (was disproportionately
  thin inside its 49-51px pill).

### Fixed (batch 12 — Clerk connected for real)

- `ClerkProvider` was wrapping `<html>` instead of living inside `<body>`, violating
  Clerk's own placement rule — existed since initial scaffolding, caught while
  verifying against Clerk's setup checklist. Fixed.
- `src/proxy.ts`'s matcher was missing `'/__clerk/:path*'` after the api/trpc entry
  — added.
- Clerk app's instance config had password auth and email-code sign-in enabled by
  default (Google was already the only OAuth provider) — didn't match
  `docs/AUTH.md`'s "Google sign-in only" spec. Disabled both via `clerk config
  patch` (previewed with `--dry-run` first).

### Added (batch 12 — Clerk connected)

- Installed the Clerk CLI, authenticated (`clerk auth login`), linked the project to
  the existing "PlugGeo" Clerk app (`clerk link --app app_3IOgUhYQq9sD6hKqjVzqoa3vuMU`),
  and pulled real dev API keys into `.env.local` (`clerk env pull`) — merged cleanly
  with existing vars. Deliberately skipped `clerk init`'s auto-scaffold and the
  playbook's public sign-in/sign-up UI, since both conflict with the project's
  already-built single-admin model — user's explicit call.
- `ADMIN_EMAIL` still needs a real value before `/admin` is reachable.

### Added (batch 11 — testimonial animation)

- `TestimonialSection` now animates the hero photo on chevron navigation, per the
  user's spec: testimonial data (name/stars/quote/image) swaps instantly, but the
  hero image "grows into place" — scales from 0.82→1 with a fading opacity, eased
  with `power3.out` over ~0.7s (no bounce/spring — reads more premium/luxury). Text
  fades/settles slightly faster (~0.4s) so it lands while the image is still
  growing. Built with GSAP per the project's animation convention, gated behind
  `prefers-reduced-motion`. Added 2 more placeholder testimonials (was 1) so the
  chevron/animation is actually demonstrable.

### Added (batch 10 — testimonials, Home complete)

- `TestimonialSection` (`components/testimonial-section.tsx`) — "What our customers
  say," built from pasted screenshots. Chevron nav (via `SectionHeader`) pages
  between testimonials one at a time; desktop shows a photo collage (hero + up to 4
  thumbnails, approximated bento layout) beside name/star-rating/quote, mobile
  shows the hero photo only. Placeholder testimonial data throughout.
- **Home page is now fully built end to end** with placeholder data: HeroSection →
  promo strip → Bestsellers → Our categories → CelebrityShowcase → Bracelet
  Collection → Pendant Collection → TestimonialSection → Footer. The temporary
  component showcase section (every atom/molecule demoed in one place, used while
  building bottom-up) has been removed now that the real page covers that ground —
  Home dropped back to a plain Server Component in the process (no more direct
  `useState`; each section's own interactivity lives in its component).

### Fixed (batch 9 — SectionHeader mobile layout)

- `SectionHeader`'s mobile layout was wrong — it had been guessed from a verbal
  description (both Figma channels were down at the time) and hid "View all"
  entirely on mobile. A real screenshot ("Bracelet Collection"/"Pendant Collection")
  showed "View all" should stay inline next to the title on mobile; only the
  chevron nav relocates below the content. Corrected, which also fixed Bestsellers'
  mobile display since it uses the same component.

### Added (batch 9 — product collection sections)

- `ProductCollectionSection` (`components/product-collection-section.tsx`) — the
  SectionHeader + ProductGrid pattern, extracted into one reusable component instead
  of copy-pasting the block per section (Bestsellers refactored onto it too).
  Desktop shows a static 4-column grid; mobile shows a real 2-item paginated window
  with working prev/next (confirmed by the screenshot — not just a reflowed grid).
- "Bracelet Collection" and "Pendant Collection" sections added to Home, built from
  a real screenshot, using `ProductCollectionSection` with placeholder data.

### Added (batch 8 — celebrity showcase)

- `CelebrityShowcase` (`components/celebrity-showcase.tsx`) — "Worn by your favorite
  celebs," built from pasted screenshots (likely the same section as the earlier
  Figma-access-blocked 557:3801/614:669). Two independent controls: `CategoryDial`
  (now supports `orientation="vertical" | "horizontal"` instead of a second
  component) picks the celebrity; `SectionHeader`'s chevron nav pages that
  celebrity's media (image or video, video gets a play-icon overlay), enabled only
  when a celebrity has more than 2 media items.
- `CategoryDial` no longer forces `capitalize` on its labels — broke "@handle"-style
  text; `ShopSidebar`'s category labels were updated to already-correct casing.

### Added (batch 7 — category collage)

- `CategoryCollage` (`components/category-collage.tsx`) — replaces `CategoryDial` on
  Home's "Our categories" section. Built from screenshots the user pasted directly
  (no Figma link this time): desktop is an asymmetric bento grid of 6 category tiles
  plus a copy block, mobile is a single stacked column. Placeholder image on every
  tile per the user's instruction. `CategoryDial` itself is untouched — still used
  by `ShopSidebar`.

### Added (batch 6 — responsive section header, "Our categories")

- `SectionHeader` gained a `subtitle` prop and responsive behavior: "View all"/
  chevron nav now hide on mobile (per the user, described but not seen directly —
  both Figma channels were down) instead of showing inline; the nav is exported
  separately as `SectionCarouselNav` so a page can relocate it below a section's
  content on mobile (done for Bestsellers, centered under the product grid).
- "Buy once, wear forever" promo strip now stacks vertically on mobile (headline,
  subtext, then both pills) instead of the desktop row layout.
- "Our categories" is now a real Home section (`SectionHeader` + the real
  `CategoryDial`, no "View all"/nav) — previously just placeholder text; the
  duplicate `CategoryDial` in the temporary showcase section was removed.

### Fixed

- **Page background/foreground were inverted** — `globals.css` had `--background`
  set to navy and `--foreground` to white, a guess made before any real Figma
  components existed. Every real component pulled since (NavBar, search bar, chips,
  sidebar) assumes black/navy text and icons on a *white* page — navy-on-navy made
  NavBar functionally invisible. Corrected: page is white, dark navy/black blocks
  (hero images, Footer's card) are accent sections within it, not the page itself.

### Added (batch 5 — Bestsellers section)

- "Buy once, wear forever" promo strip and a `SectionHeader` component (title +
  "View all" + prev/next chevron nav, reusable) built from Figma 603:657/603:658.
  Both integrated into the real Home page.
- `ProductGrid` gained a `columns` prop (was hardcoded to 2) so Home's 4-column
  Bestsellers section reuses it instead of a near-duplicate component.
- Bestsellers' actual product row (the 4-column grid content) is still placeholder
  data — no Figma node given for it yet.

### Added (batch 4 — progress log, Home hero)

- `PROGRESS.md` — a running-state doc (component inventory, resolved decisions, flagged
  items) distinct from this changelog; `CLAUDE.md` now requires reading it before and
  updating it after every task.
- `HeroSection` (`components/hero-section.tsx`), built from real Figma nodes (598:653
  desktop, 602:656 mobile) with real exported photography in `public/hero/`. Desktop is
  a static 3-column photo collage; mobile is a swipeable carousel through all 5 collage
  photos (`HeroMobileCarousel`, native scroll-snap) with the Indicator tracking the
  active slide — confirmed behavior, not a guess. Integrated into the real Home page.
- Fixed a duplicate-`<h1>` bug while wiring the hero in: Home already had an `<h1>`, so
  the hero's "Best collection" headline uses `<h2>` instead.

### Added (batch 3 — layout, sidebar, galleries)

- **New Figma access path**: the `claude.ai Figma` MCP connector (get_design_context/
  get_metadata/get_screenshot) is now available in-session alongside the REST API
  pipeline — used `get_screenshot`/`get_metadata` for the large/ambiguous frames
  (horizontal gallery, sidebar, footer, mobile drawer) to get real visual + structural
  ground truth instead of inferring purely from raw node JSON.
- Site-wide layout: `(storefront)/layout.tsx` now renders `NavBar` + `Footer` and
  applies the 24px/40px (mobile/desktop) side padding site-wide, with `Footer` full-
  bleed as the one exception — per spec.
- `NavBar` reworked: desktop centers logo+links in the viewport with search/basket
  pinned far right (3-col grid); mobile centers the logo with a 48×48 Hugeicons
  menu-03 button opening the new `MobileNavDrawer`.
- `MobileNavDrawer`, `Footer` (dark promo card + copyright row + glassmorphic
  `BackToTopButton`), `ImageThumbnail`, `ImageCarousel` (depth-blurred 3-up gallery),
  `Indicator` (image-count dots, now wired into `ProductCard`), `CategoryDial`
  (vertical coverflow picker), `ShopSidebar`, `ShopControlsBar`, `ProductGrid`,
  `ProductList` — all new, built from real Figma nodes (see chat for the full node-ID
  list).
- `ProductCard` gained a `layout: "card" | "row"` prop instead of a second component —
  the Shop gallery-mode listing turned out to reuse the exact same info block, just
  arranged horizontally. Internals factored into `ProductInfo`/`AddToBasketButton`
  sub-pieces shared by both layouts.
- `lib/coverflow.ts` — distance-based size/radius/blur math shared by `PaginationDial`
  and `CategoryDial` (same visual mechanic, confirmed from two separate Figma nodes).
- `Pill` generalized with an `active` prop (gray-fill vs. outline) instead of building
  separate variant-chip/filter-chip components — confirmed all three (hashtag,
  variant-selector, price-filter) are the same Figma "chip" component.
- `SortToggle`/`LayoutToggle` active-state color corrected from a guessed
  `bg-brand-primary` to the now-confirmed `bg-gray` (seen in a second Figma instance,
  `shopControlBar`).
- Real assets pulled from Figma: `public/logo.png`, `public/logo-mark.png` (footer's
  small wordmark), `public/footer-chain.png`.
- `/shop` page now a real (placeholder-data) integration of sidebar + controls bar +
  grid/list toggle + pagination, not just a stub.

**Flagged, not blocking:**

- `Footer`'s background was a raster image fill in Figma; approximated with a CSS
  navy-to-black gradient instead of embedding the raster asset.
- `ImageCarousel`'s side-image blur/scale is a clean approximation, not a pixel copy
  of the source's exact overlapping frame geometry.
- `ProductCard`'s "row" layout image was measured at 341px in Figma but scaled down
  (140/220px) — 341px reads too large for a compact list row; flag if that was
  actually intended.
- `ShopSidebar` is desktop-only (the Figma node was literally named
  "shopDesktopSidebar" — no mobile variant provided yet).

### Added

- Project scaffolding: root `CLAUDE.md` and `/docs` (PROJECT, ARCHITECTURE, DATABASE,
  API, AUTH, ADMIN, TESTING, DEPLOYMENT, DESIGN_SYSTEM, COMPONENTS, FIGMA_MAPPING)
  capturing all locked stack/scope decisions.
- Next.js app scaffold: App Router + TypeScript + Tailwind + shadcn/ui, route groups
  for the storefront and `/admin`, Clerk auth with single-admin allowlist, Drizzle +
  Neon schema (products/categories/images/variants), Vitest + Playwright configs,
  Cloudflare/OpenNext deploy config.
- Design system tokens pulled from Figma variables (color, typography, spacing,
  radius, blur) and wired into `globals.css`.
- 14 project skills under `.claude/skills/` (4 global: design-tokens,
  nextjs-architecture, accessibility, definition-of-done; 10 contextual) to enforce
  code quality and business-viability practices throughout the build.
- Figma REST API pipeline (personal access token, no Dev Mode seat required) for
  pulling real component/screen data — see `docs/FIGMA_MAPPING.md`.
- Hugeicons (`@hugeicons/react` + `@hugeicons/core-free-icons`) as the icon system,
  replacing lucide-react (unused, removed).
- Quinn (heading font, local `.otf`) wired up via `next/font/local`; `src/fonts/`
  added for local font files. Inter set as the body font.
- `ProductCard` component (`src/components/product-card.tsx`), built pixel-for-pixel
  from the real Figma node (557:3742) — first component built against real Figma data
  rather than tokens alone.
- `products.compareAtPrice` column, confirmed necessary by the real Product Card
  design (sale price + strikethrough original price) — migration generated.
- Three new type-scale tokens discovered from real component data and not previously
  documented: `text-eyebrow`, `text-card-title`, `text-price`.
- `Button` (`src/components/ui/button.tsx`) restyled from the real Figma node
  (557:3730): black fill, white Quinn Bold text, rounded-md, space-token gap/padding.
  Height/width/text-size/padding exposed as props rather than a fixed size scale.
- `Icon` (Hugeicons wrapper), `Skeleton`, and `Tooltip` (Base UI-backed) atoms — no
  Figma reference for these, built directly per the user's direction.
- `Divider` — self-designed per spec (gray token, 1px, variable length).
- `Spinner`, built from the real Figma node (557:5091): a 5-bar pinwheel graphic,
  recolored to `currentColor` and spun via CSS, `motion-reduce`-aware.
- `SearchInput`, `PaginationDial`, `LayoutToggle` (Shop grid/gallery control),
  `SortToggle`, `Pill`, and `NavBar` — all built from real Figma nodes (557:5083,
  557:4754, 557:4197, 557:4383, 557:3737, 566:6255 respectively). `toCssLength`
  extracted to `lib/utils.ts` as a shared helper (was duplicated in `Button`).
- `public/logo.png` — real logo asset exported from Figma (node 557:3714).
- Hugeicons matches confirmed exact for every icon used so far (`Search01Icon`,
  `ShoppingBasket01Icon`, `ShoppingBasketAdd01Icon`, `GridViewIcon`,
  `GalleryHorizontalIcon`, `ArrowUpZAIcon`, `ArrowDownZaIcon`) — the designer used
  real Hugeicons throughout, so icon SVGs trace 1:1 to the library rather than being
  hand-copied.

### Component build status

Atoms: Button ✅, Icon ✅, Divider ✅, Spinner ✅, Skeleton ✅, Tooltip ✅, Logo
(deferred to navbar — now embedded in NavBar), Badge (skipped — not in Figma), Price
text (no longer needed — dropped). Molecules: SearchInput ✅, LayoutToggle ✅,
SortToggle ✅, Pill ✅, PaginationDial ✅. Organisms: ProductCard ✅, NavBar ✅
(built ahead of the atom sweep, or alongside it, as node IDs came in — not following
strict atom→molecule→organism ordering, following whatever the user provides next).

### Flagged — needs a look, not blocking

- `PaginationDial`: the Figma source blurred every page *before* the active one and
  left everything from active onward sharp — read as inconsistent/experimental rather
  than intentional, so implemented as symmetric distance-based blur instead. Confirm
  if the asymmetric version was deliberate.
- `LayoutToggle`: Figma distinguished selected/unselected via filled-vs-outline icon
  fill; free-tier Hugeicons only has outline versions, so selected state uses a filled
  navy chip behind the icon instead.
- `NavBar`: logo renders *above* nav links (vertical stack), not beside them — matches
  the captured node exactly, but worth confirming this is the intended desktop layout
  and not a mobile/compact variant.
- `NavBar` / `ProductCard` basket icons: no confirmed behavior since there's no
  checkout in scope — both are inert links/buttons for now.

### Changed

- Public screen list finalized against Figma: Home, Grillz (dedicated), per-category
  template, Shop (grid/gallery layouts), Product Detail — route scaffolding added for
  each.
- Type-scale line-heights corrected from earlier guesses to measured values: Quinn
  (heading) confirmed at a 1.4 ratio, Inter (body) confirmed at ~1.21, both applied
  uniformly across the scale (font-intrinsic constants, not per-role choices).
- Brand name confirmed as **Plug Geo** (resolves the earlier open item).

### Removed

- Checkout/cart/orders/payments taken out of scope — this is a catalog/showcase site.
  Removed the `orders`/`order_items` schema tables and related doc references.
