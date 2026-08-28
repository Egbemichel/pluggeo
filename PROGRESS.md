# Progress Log

Running state of the Plug Geo build — what's decided, what's built, where it came from,
and what's still flagged. This is the fast-context file: read it before starting any
task, update it before finishing one (see the rule in `CLAUDE.md`). It's a *snapshot*,
not a changelog — organized by topic, kept current, old entries edited/removed rather
than piling up. `CHANGELOG.md` stays the dated, append-only record; this file is "what's
true right now."

## Status at a glance

Scaffolding, design tokens, and ~34 components are built. **Home is fully built,
top to bottom, with placeholder data**: HeroSection → promo strip → Bestsellers →
Our categories → CelebrityShowcase → Bracelet Collection → Pendant Collection →
TestimonialSection → Footer (shared layout). The old "temporary component showcase"
scratch section has been retired now that the real page is complete — Home is a plain
Server Component again (no direct `useState`; interactivity lives in the leaf
components that need it). Shop has real (placeholder-data) integration: sidebar +
controls + grid/list toggle + pagination.

## Resolved decisions

- **App-wide z-index sweep: every full-viewport overlay now portals to
  `document.body`** (2026-08-29), per the user after the PDP-specific
  SearchOverlay fix below — asked to find and fix the whole class of issue,
  not just the one instance. Audited every real `position: fixed` element in
  the app (grepped for `fixed`/`z-`, cross-checked against actual usage —
  there are exactly 4: `SearchOverlay`, `MobileNavDrawer`, `MobileFilterDrawer`,
  and `BagFlightProvider`'s flying icon). Verified `SearchOverlay`/
  `MobileNavDrawer` with a fresh Playwright sweep across all 6 storefront
  routes post-fix — all correct everywhere (the earlier fix traces to the
  *shared* `NavBar` component, so it was already fixed app-wide, not
  page-specific; "several pages" was consistent with that, not evidence of
  more distinct bugs). `MobileFilterDrawer` (rendered from inside `/shop`'s
  own `page.tsx`, i.e. nested under that page's own `<ViewTransition>`)
  measured correctly too in this specific test, but is exposed to the exact
  same risk shape as a matter of structure. `BagFlightProvider`'s flying icon
  is a sibling of `<main>` at the layout level, not nested under any
  `<ViewTransition>` or `view-transition-name` element — confirmed unaffected,
  left alone.
  Rather than only patching the one confirmed ancestor (`viewTransitionName`
  on NavBar's old wrapper div), portaled all three overlay components
  (`SearchOverlay`, `MobileNavDrawer`, `MobileFilterDrawer`) directly to
  `document.body` via `createPortal` — this removes the DOM ancestor chain
  between the overlay and the viewport entirely, making the whole bug class
  (any future ancestor with `transform`/`filter`/`perspective`/
  `will-change: transform`/`view-transition-name` — GSAP's reveal animations
  leave inline `transform`s behind permanently, and every `page.tsx`'s
  `<ViewTransition>` can do the same) structurally impossible rather than
  fixed one occurrence at a time. No SSR/hydration guard needed: all three
  components already return `null` before `open`/`mounted` is true, and that
  only ever flips true from a client-side interaction, so `document` is
  always available by the time the portal branch runs. Re-verified via
  Playwright across all 6 routes post-change (both breakpoints) — all three
  overlays span the full viewport everywhere, and the filter drawer's node
  is confirmed as a genuine direct child of `<body>` in the actual DOM.
- **Fixed: SearchOverlay/MobileNavDrawer rendering *under* PDP content**
  (2026-08-29) — the animation pass above anchored the navbar for page
  transitions via `style={{ viewTransitionName: "site-header" }}` on its
  wrapping div in `StorefrontLayout`. That div is an ancestor of NavBar's own
  `<SearchOverlay>`/`<MobileNavDrawer>` (both rendered as NavBar's
  siblings-in-a-fragment) — and a `view-transition-name` ancestor becomes a
  *containing block* for `position: fixed` descendants, so their `fixed
  inset-0` overlays were confined to the navbar wrapper's own small box
  instead of the full viewport. Anywhere below the navbar (which is most of
  a page, most visibly PDP's tall content) fell straight through to normal
  page content. Confirmed via `elementFromPoint`/ancestor-chain inspection
  (the overlay's `fixed` root wasn't even in the hit-test chain at a point
  below the nav), not guessed. Fixed by moving `viewTransitionName` off that
  wrapper and onto NavBar's own `<nav>` element instead — `<nav>` isn't an
  ancestor of the overlay siblings, so the containing-block quirk no longer
  reaches them, while the navbar itself keeps its page-transition anchoring
  (the CSS in `globals.css` targets the transition group by name, not by DOM
  selector, so it needed no change). Re-verified the same way post-fix: the
  overlay's `fixed z-50` backdrop now wins the hit test everywhere,
  including on PDP.
- **Site-wide animation & micro-interaction system built** (2026-08-28/29),
  from a full written spec (ground rules: viewport-gated entrances, staggering
  as the default rhythm, one shared tone app-wide, restraint, `prefers-reduced-motion`
  respected everywhere). Shared infrastructure first, everything else builds on it:
  - `src/lib/motion.ts` — single source of truth for every ease/duration/stagger
    token (`EASE.standard/snappy/drawerOpen/drawerClose`, `DURATION.entranceLg/Md/Sm/
    micro/drawer/flight`, `STAGGER.text/tight/cards/dialWave/list`) plus
    `MOTION_QUERY.full/reduced` and `PAGE_TRANSITION`. Every other animation in
    the app reuses these rather than inventing its own numbers.
  - `useViewportEnter` (`src/hooks/use-viewport-enter.ts`) — the one place that
    touches `IntersectionObserver`; `once: true` default unobserves after first
    fire, which is what makes an entrance "run once per page load, not on
    re-scroll" for free (a fresh route mount is already a fresh observer).
    `useReveal`/`RevealText` are convenience wrappers over it for the common
    homogeneous fade/slide(+stagger) case; per-element *different*-direction
    builds (Hero, Categories desktop) call it directly with a hand-built
    `gsap.timeline()` instead.
  - `useDialWave` (`src/hooks/use-dial-wave.ts`) — the one shared "stadium
    wave" interaction, consumed internally by `CategoryDial`/`PaginationDial`
    so every existing render site inherits it with no per-site changes. Uses
    the Pointer Events API (one code path for desktop hover and mobile touch
    drag) and GSAP's native `stagger: {from: index}` for the ripple math —
    simpler than hand-rolling propagation. Verified the scale animation was
    genuinely running via `getComputedStyle(el).transform` (GSAP writes the
    legacy composite `transform`, not the modern `scale` property, for plain
    HTML elements — same gotcha as `Spinner`'s SVG `transform` *attribute*
    from an earlier pass; checking `.scale` looks inert even when it isn't).
  - `BagFlightProvider` (`src/components/bag-flight-provider.tsx`) — the
    Chrome-download-style flying Add-to-Bag icon (first `createContext` in the
    codebase). A real `<Icon>` clone animates along a curved path
    (`MotionPathPlugin`, bundled in plain `gsap`) to whichever nav target is
    currently visible (desktop bag icon or mobile hamburger), badge increments
    exactly on arrival. New shared `AddToBagButton` (`src/components/ui/
    add-to-bag-button.tsx`) replaces every previously-unwired "Add to bag"
    button site-wide (`ProductCard`, `ProductSpotlight`, `ProductDetailSection`,
    `SearchOverlay`'s results) with one real, wired trigger.
  - Page transitions — React's native `<ViewTransition>` (from `"react"`),
    confirmed zero-config-supported by Next.js 16.3.2 (it aliases the `"react"`
    import to its own bundled build that exports it, even though the plain
    `node_modules/react` doesn't). Every `(storefront)/**/page.tsx` wraps its
    content in one; internal `<Link>`s carry `transitionTypes={["nav-forward"]}`
    or `["nav-back"]` for a directional slide (both pages visible mid-transition),
    `router.back()`/real browser back-forward can't carry a type (confirmed via
    Next's own router types) and fall through to a plain crossfade instead of a
    hard cut. `NavBar` is anchored via `viewTransitionName` so it never slides
    with the page content. Verified with a real mid-transition Playwright
    screenshot, not just docs-confidence.
  - **Section builds**: Hero (`hero-section.tsx`/`hero-mobile-carousel.tsx`) —
    desktop's 5 collage images + heading + "Shop now" assemble via one
    hand-built timeline, each element staggered in from a different direction
    (left/top/right/bottom per its grid position); mobile's track "swipes
    itself in" (slide+fade) on load, heading/footer settle after. Categories
    (`category-collage.tsx`) — desktop bento tiles fade in from a direction
    matching their position (Grillz's big block from the left, top row from
    above, the tall right column from the right); mobile reuses `useReveal`'s
    stagger over the *existing* DOM order (already 2-top-then-stack, no layout
    change needed for "stacking bricks"). `SectionHeader`'s title/subtitle now
    render via `RevealText` (word-stagger) — applied at the shared-component
    level so every section's header gets it, not just Categories' (which was
    the one explicitly required); `CopyBlock`'s heading does too. Celebrity
    media tiles (`celebrity-showcase.tsx`) fade in right-to-left, tight
    stagger interval — first appearance is viewport-gated (run once), every
    later celebrity/media-page switch re-plays (interaction, not scroll,
    same split as `TestimonialSection`'s Flip). PDP (`product-detail-section.tsx`)
    — category/name/price → details → quantity → Add to bag → Customize all
    stagger in top-to-bottom via one `useReveal`, since it's a homogeneous
    fade-up sequence, not a per-element-direction build. Search
    (`search-overlay.tsx`) — results fade in top-to-bottom, staggered,
    whenever the query goes from empty to populated (a `SearchResults`
    subcomponent's mount effect *is* the "populate" trigger, no extra state
    needed to detect it).
  - New `useAccordion` hook (`src/hooks/use-accordion.ts`) — shared open/close
    height+opacity mechanic for `ProductCustomize`'s "Customize" dropdown and
    `PriceFilterPanel`'s "Custom price" disclosure (both previously
    conditionally-rendered with no exit animation at all — now always mounted,
    height-measured via `scrollHeight`, animated open/close). Both drawers
    (`MobileNavDrawer`, `MobileFilterDrawer`) retrofitted onto the
    already-built `useDrawerTransition` — real mirror-image open/close
    (open: panel slides in, then items stagger-fade-in top to bottom; close:
    items stagger-fade-out bottom to top *first*, then the panel slides out),
    verified via direct DOM sampling mid-close showing the last-DOM item
    already fading while the panel transform is still identity.
  - Shop controls (`SortToggle`/`LayoutToggle`) — new shared `useTogglePulse`
    hook gives the newly-active option a quick snappy scale-punch on top of
    the existing CSS color fade, so a sort/layout switch reads as a deliberate
    confirmation. Icon micro-interaction sweep — one `:has(> svg:only-child)`
    rule in `globals.css` gives every *bare* icon button (chevrons, close/
    cancel, search — anything with no bespoke GSAP treatment already) a
    restrained hover/press scale; deliberately plain CSS, not GSAP, per the
    project's own stack rule (GSAP is for motion beyond what a CSS transition
    covers). Icons with their own GSAP treatment (dial items, the toggle
    pulse, the flying bag icon) set `transform` inline via JS, which always
    wins over this rule, so there's no fight between the two.
  - **Verification**: `tsc --noEmit`/lint/`next build`/`vitest` all clean.
    `playwright test` has one **pre-existing, unrelated** failure —
    `e2e/home.spec.ts` looks for a heading with the text "Plug Geo," which
    doesn't exist anywhere in the app as a heading (only as image alt text/
    aria-labels); not something any animation-pass edit touched, flagged
    below rather than silently patched. Reduced-motion re-run (`emulateMedia
    reducedMotion: "reduce"`) confirmed content lands instantly at its final
    state (Hero/Categories opacity 1 immediately, drawers still mount/unmount
    correctly) with no translate-driven motion. No stray `scratch-*` files
    left in the repo root.
- **`ProductCard` row-layout hover reverted to the default fade** (2026-08-28)
  — per the user, the product list under `ProductSpotlight` doesn't need
  the scale-up treatment; only the "card" layout (grid tiles) keeps it.
- **`ProductSpotlight` images enlarged (3x mobile / 4x desktop), with a
  real capping mechanism added along the way** (2026-08-28) — the literal
  request overflowed the viewport horizontally on mobile (316px of
  page-scroll, confirmed via measurement) and, since `ProductSpotlight` is
  `sticky`, made the pinned block tall enough (~930px, literal 4x on
  desktop) to fully cover the product list rows beneath it while scrolling
  — confirmed via `elementFromPoint` at a row's own center resolving to one
  of the spotlight's own elements, not the row, meaning those rows were
  genuinely unclickable, not just visually crowded. This was a real
  three-way tension between the user's own requirements (much bigger
  images vs. the sticky-while-scrolling behavior built earlier vs. no
  horizontal overflow), so it was surfaced directly rather than picking a
  number unilaterally — the user chose "cap the size, keep sticky, leave a
  real strip of the list visible" over the alternatives (full literal size
  with sticky dropped, or full literal size with the list mostly covered).
  Implementation: `useSyncExternalStore` (not `useEffect`+`useState`, which
  hits the `react-hooks/set-state-in-effect` lint rule and needs an
  SSR-unsafe workaround) subscribes to both a `(min-width: 48rem)` media
  query for the mobile/desktop scale split and `window.innerHeight` for the
  sticky-height budget; a `ResizeObserver` on the coverflow's own container
  supplies its real measured width. Active tile size is capped by the
  lesser of: the literal 3x/4x target, `containerWidth / 1.65` (clears the
  active tile + one peeking neighbor on each side without overflow), and
  a budget against 70% of viewport height for the *entire* sticky block
  (image + nav row + Indicator + price/CTA row, ~300px of fixed chrome
  budgeted in) — neighbor size and the coverflow's translateX offset step
  both derive proportionally from whatever the (possibly capped) active
  size ends up being, so the coverflow's own geometry never breaks. Verified
  under natural incremental scrolling (not just one measurement) that at
  least one substantially-visible list row remains on screen at every
  scroll position. Net effect on a typical viewport: ~1.5x the original
  size, not the literal 3x/4x, by explicit user choice.
- **App-wide clickable-element hover feedback added** (2026-08-28) — every
  button/link/`[role="button"]` gets a subtle opacity fade on hover via one
  new `@layer base` rule in `globals.css` (same pattern as the existing
  `cursor: pointer` rule), wrapped in `(hover: hover)` so a touchscreen tap
  doesn't leave it stuck faded. `ProductCard` (both layouts) is the one
  explicit exception, per the user: `hover:scale-105 hover:z-10` on the
  outer `<article>` instead of the fade, with `hover:opacity-100` on its
  inner Links to cancel the base rule so hovering a card only scales it.
  Tailwind's `hover:` utilities on a specific component always win over the
  base-layer rule regardless of selector specificity (that's what `@layer`
  ordering guarantees) — this is how the exception coexists with the global
  rule without needing to touch every other component. **Debugging note for
  future sessions**: verifying this took a real detour — an intermediate
  edit made with `sed -i` via the Bash tool silently never reached the dev
  server's HMR (the compiled CSS never contained the new class at all,
  confirmed by reading the actual `document.styleSheets` output), which
  briefly looked exactly like a broken Tailwind/GSAP config. Re-doing the
  same edit with the Edit tool compiled and worked immediately. Prefer the
  Edit tool over shell text-editing commands for source files the dev
  server needs to hot-reload — `sed`/similar are fine for one-off renames
  across many files, not for a change you're about to verify live.
- **`Spinner` rebuilt to bounce per-bar instead of spinning as a unit, app-wide
  loading system established** (2026-08-28) — per the user: each of the 5 bars
  now scales independently from its own bottom edge with a springy
  `elastic.out` GSAP tween, staggered so neighbors are visibly out of phase
  (piano-key/accordion look), replacing the old whole-shape `animate-spin`.
  GSAP (not CSS) since `elastic` easing plus true per-bar out-of-phase
  looping has no clean CSS equivalent; gated behind `prefers-reduced-motion`
  via `gsap.matchMedia()`, same pattern as `TestimonialSection`'s Flip
  animation. Verifying this actually worked took real debugging, not just a
  glance: an isolated throwaway test route + sampling each bar's live
  transform over time showed GSAP animates SVG `<rect>` elements through the
  `transform` *attribute* (a matrix string), not `element.style.transform` —
  checking the wrong property made three separate diagnostic passes look
  like the animation was completely inert when it wasn't. The rule the user
  gave for the whole app: product-card loading states use a new
  `ProductCardSkeleton`/`ProductGridSkeleton` (matches `ProductCard`'s card
  shape and `ProductGrid`'s grid classes exactly), everything else uses
  `Spinner`. Wired into `loading.tsx` for the two route segments that are
  genuinely async Server Components (`await params`):
  `/category/[slug]` (skeleton, since its content really is a grid of
  product cards) and `/product/[slug]` (spinner, since the PDP isn't).
  `/shop` and `/bag` do no server-side async work (fully client-rendered,
  local state only), so there's nothing for Next's `loading.tsx` to bridge
  there — intentionally skipped rather than added just to have one.
- **`/bag` ("My shopping bag") built** (2026-08-28), from a pasted
  screenshot — both nav basket icons (desktop `NavBar`, `MobileNavDrawer`)
  now point at `/bag` instead of the never-built `/cart`, per the user.
  `SearchResultCard` was generalized into `ProductLineItemCard`
  (`src/components/product-line-item-card.tsx`) once the bag page needed
  the identical image/title/category/variant-summary/price row with
  "Remove" (`ShoppingBagRemoveIcon`) instead of "Add to bag"
  (`ShoppingBagAddIcon`) as the trailing action — the pill is now driven by
  an `action: {label, icon, onClick}` prop instead of a hardcoded
  "Add to bag" pill. `QuantityStepper` gained a controlled/uncontrolled
  dual mode (`value`/`onChange` optional, same shape as `PriceFilterPanel`'s
  "fully controlled" fields) so the bag page can read/own each line's
  quantity for its subtotal, while the search overlay and PDP keep their
  old self-contained decorative behavior by simply omitting those props.
  **Scope note** (see the explicit out-of-scope rule in `CLAUDE.md`/
  `docs/PROJECT.md`): quantity/remove genuinely work and the subtotal
  recalculates live — real local component state, not decorative — but it's
  seeded from placeholder data with no persistence, no cart table, and
  no real "Add to bag" wiring from anywhere else in the app; "Checkout" is a
  plain inert button, same flag as every other basket control site-wide.
  This is a visual page, not cart/checkout infrastructure — doesn't cross
  the line the out-of-scope rule draws.
- **Search overlay built and wired to the previously-inert search icon**
  (2026-08-28), from a pasted screenshot — `SearchOverlay`
  (`src/components/search-overlay.tsx`), opened from either NavBar's
  desktop search icon or `MobileNavDrawer`'s search icon (both had just been
  a plain `aria-label="Search"` button with no `onClick` since they were
  first added). Open state lives in `NavBar` (not the overlay itself) since
  two separate triggers need to share one instance; the mobile trigger
  closes the drawer and opens the overlay via a combined `onSearchClick`
  handler passed down to `MobileNavDrawer`. Same dismiss pattern as
  `MobileNavDrawer` (backdrop click + Escape). Results render via what's now
  `ProductLineItemCard` (`src/components/product-line-item-card.tsx` — see
  its own resolved-decision entry below for the rename/generalization) —
  image/title/category, a Size/Width and Gold color/Gold type summary line
  (mirroring `ProductCustomize`'s own fields — one arbitrary configuration
  per result, not a "currently selected" state), price, and an inert
  Add-to-bag control (`QuantityStepper` + pill, both breakpoints — initially
  mobile-only per the screenshot crop, the user then confirmed it belongs on
  desktop too and on the PDP directly above "Add to bag"; `QuantityStepper`
  extracted to `src/components/ui/quantity-stepper.tsx` once it had two
  callers). Both controls are local decorative-only state — no cart/checkout
  in scope. A real mobile bug was
  found and fixed while verifying: the CTA block doesn't shrink, and as a
  side-by-side sibling of the image+text on a 375px viewport it starved the
  text column down to a few px (word-by-word wrapping, price/button visibly
  overlapping) — confirmed via bounding-rect checks, not guessed. Fixed by
  giving the CTA block its own full-width row below the image+text on mobile
  instead of squeezing beside it; desktop keeps the reference's side-by-side
  placement, where there's actually room. No real search backend/catalog
  query exists yet — typing anything shows the same placeholder result set.
- **PDP first section built (`/product/[slug]`)** (2026-08-28), from pasted
  desktop+mobile screenshots (no Figma node/link this time) — gallery
  (category/title/price/description/"Add to bag") beside an image gallery.
  Took two real corrections from the user before landing: (1) first attempt
  reused `ImageThumbnail` as-is (square main image, thumbnails in a separate
  row below with wide gaps) and a custom Button+Divider+Icon "Add to bag" —
  both wrong. Root cause for the gallery: `ImageThumbnail` wasn't actually
  used anywhere else in the app yet (its "PDP gallery selector" purpose was
  aspirational, not load-bearing), so it was safe to redesign in place rather
  than build a parallel component — rebuilt as one shared card frame
  (rounded-xl border) holding a landscape `aspect-8/5` main image and 3
  `aspect-4/3` thumbnails in a tight `grid-cols-3` below it, all inside the
  same frame, instead of two visually-separate blocks. (2) The "Add to bag"
  button turned out not to be a new design at all — per the user it's the
  *exact same* button already built for `ProductSpotlight` (Shop's
  list-layout featured section): white bg, navy border/text, uppercase,
  `text-h3`, `ShoppingBasketAdd01Icon`. Reused verbatim instead of guessing a
  new icon-button pattern. `QuantityStepper` (shared with `SearchResultCard`)
  sits directly above it, added once the user pointed out it belonged there
  too. Text sizes (category/title/price) bumped a step
  above what the same fields use on `ProductCard`/`ProductInfo`, since this
  section gets far more dedicated space per element than a compact card —
  eyeballed against the screenshot, not a measured Figma value, flagged if
  it still reads off. `NavBar`'s back-button variant (already shared by
  Grillz and `/category/*`) extended to `/product/*` too, same treatment.
  Every product currently links to the same placeholder title/price/image
  data (no real per-slug catalog query yet). The description is the one
  field that does vary: 6 real, on-brand copy blocks (no more lorem ipsum)
  picked deterministically from the slug, so different slugs read as
  genuinely different products. A "Customize ⌄" variant-selector section
  (Size/Width/Gold color/Gold type) sits directly under "Add to bag" —
  collapsible (same rotate-chevron pattern as `PriceFilterPanel`'s "Custom
  price" disclosure), built entirely from existing pieces: `Pill` for every
  option (its own file comment already named "variant-selection chips" as
  one of its three confirmed uses), `Divider`'s vertical self-stretch
  fallback separating the Width/Gold color/Gold type row without a
  hardcoded height. New `ProductCustomize` component
  (`src/components/product-customize.tsx`), placeholder options only — no
  real variant/inventory data model yet. Below that, the PDP's second
  section is a related-products grid ("More From The Plug" — header copy
  rewritten in Plug Geo's own voice rather than the reference screenshot's
  generic wording): same 4-col/2-col responsive `ProductGrid` split every
  other grid on the site uses, plus an "Explore more" CTA that's full-width
  on mobile and self-sizing on desktop. New `RelatedPiecesSection`
  (`src/components/related-pieces-section.tsx`) — kept separate from
  `CategoryPageContent`'s near-identical "More from us" block rather than
  extracted into a shared component, since the two differ in one real way
  (this CTA's responsive width) and the duplicated JSX is only a few lines.
  Placeholder product data — no real related-products query yet.
- **Generic `/category/[slug]` page built from a filled Bracelets Figma
  reference** (2026-08-28) — per the user, "every single component already
  exists just load them in": no new UI components, just composition. Server
  Component (`app/(storefront)/category/[slug]/page.tsx`) awaits `params`,
  derives a title-cased category label and a per-slug tagline (`TAGLINES`
  lookup, falls back to "Handcrafted for you" for any slug not in the map —
  no CMS/admin category field exists yet to source this from), and hands both
  to a new Client Component (`category-page-content.tsx`) that holds the
  pagination state: `SectionHeader` (category + tagline) → `ProductGrid`
  (4-col desktop / 2-col mobile, same split-render pattern Shop already uses)
  → `PaginationDial`/`CategoryDial` pagination (same desktop-flat/
  mobile-coverflow pair Shop's mobile pagination uses) → a second
  `SectionHeader` ("More from us" / "Witness luxury, first hand") →
  another `ProductGrid` → a standalone "Explore more" `Button` linking to
  `/shop`. All placeholder product data (no real per-category catalog query
  yet). `NavBar`'s back-button variant (previously Grillz-only) generalized
  to also cover `pathname.startsWith("/category/")` — same treatment as
  Grillz's per the reference screenshot (back button in place of nav links,
  mobile drawer skipping Home/Shop) — while a separate `isGrillz` flag keeps
  the top-hero-image-bleed behavior scoped to Grillz only, since category
  pages have no equivalent image. Verified via Playwright at `/category/
  bracelets`, 1440px and 375px, 0px horizontal overflow at both, full build +
  test suite clean, Grillz/Home navbars re-screenshotted afterward to confirm
  the NavBar generalization didn't regress either.
- **Grillz page: Best Grillz Collection + closing cast section added**
  (2026-08-28) — `ProductCollectionSection` (reused as-is) then a new
  `GrillzCastSection` (`src/components/grillz-cast-section.tsx`), the last
  section before the Footer. Real product-cast photos in
  `/public/assets/{mobile,desktop}` (`cast-mobile.png` 366x299,
  `cast-desktop.png` 605x490, exact ratios read from each PNG's own IHDR
  chunk). Extracted `CategoryCollage`'s local `CategoryCopy` helper
  (eyebrow-heading + bold-subheading + body pattern) into a shared
  `CopyBlock` (`src/components/ui/copy-block.tsx`) once this section needed
  the identical pattern, rather than duplicating it — `CategoryCollage` now
  imports it too. The eyebrow line ("FREE SHIPPING ON TODAY ORDERS") is typed
  pre-uppercased in source: it's Inter (`font-sans`), which respects real
  lowercase, unlike Quinn (`font-heading`) which renders visually caps-like
  regardless of source case — writing it in sentence case would have shown
  sentence case, not matching the reference. "Explore more"'s destination is
  unconfirmed (no PDP/info page built yet) — points at `/shop` like "Shop now"
  for now.
- **Grillz hero built** (2026-08-28) — first real content for the "dedicated,
  bespoke layout" page docs/ARCHITECTURE.md already called out (was a plain
  stub). Real assets from the user in `/public/assets/mobile` and
  `/public/assets/desktop` (`grillz-home_1-{,mobile-}top.png`,
  `grillz-home_2-{,mobile-}bottom.png`) — transparent-PNG grill cutouts, not
  rectangular photos; their diamond pattern already runs edge-to-edge at their
  own top/bottom, which is what gives the "grill continues past the frame"
  look, not a CSS crop. Exact aspect ratios read from each PNG's own IHDR chunk
  (1440x275 / 1440x504 desktop, 393x99 / 393x134 mobile) rather than guessed.
  Both images break out of `<main>`'s side padding to run full-bleed
  (`-mx-6 md:-mx-10` + matching width compensation).
  The top image needs to render *above* the shared NavBar, per the user —
  first attempt faked this with a negative-margin overlap + an opaque,
  higher-z-index navbar wrapper, which the user corrected: they wanted the
  image to actually precede the navbar, not sit behind it. Since NavBar always
  renders before `<main>` in `StorefrontLayout`, page content can never
  literally appear above it — so `NavBar` itself (already pathname-aware, for
  the back button below) renders the top image, prepended before its own
  `<nav>`, only on `/grillz` (`GrillzTopBleedImage`,
  `src/components/grillz-top-bleed-image.tsx`). `StorefrontLayout`'s navbar
  wrapper reverted to plain (the opaque/z-20 addition was only ever for the
  overlap trick, now gone). Grillz hides the normal desktop nav links; the
  mobile hamburger was hidden too at first, then the user asked for it back
  (back button + hamburger both visible on mobile) — but its `MobileNavDrawer`
  still skips Home/Shop, showing only search/basket. Rather than teaching
  `MobileNavDrawer` a route-specific flag, `NavBar` just passes it an empty
  `links` array on `/grillz`, which already renders nothing for that block.
  New `BackButton` (`src/components/ui/back-button.tsx`) — same glassmorphic
  look as `BackToTopButton`, both now sharing a new `GlassIconButton` visual
  shell instead of duplicating the classname string. `NavBar` renders it in
  the previously-empty first grid cell (desktop and mobile) only when
  `pathname === "/grillz"` — a route-specific special case, not a general
  NavBar variant. It calls `router.back()` rather than linking to a fixed
  href, since Grillz is reachable from multiple places (Home's category
  collage, Shop, ...).
- **`ProductSpotlight` follow-up fixes** (2026-08-28), all from live testing:
  (1) the `max-w-md` cap left the coverflow packed at the left edge of the
  much-wider desktop content column with a lot of dead space to its right —
  removed it so the component is `w-full`; the coverflow row still centers
  itself within that width via `justify-center`, but the info row (text +
  Details/Add-to-bag) switched from `justify-between` (which then would've
  stretched the buttons far from the text across that same wide space) to
  `self-start` + a fixed gap, so it sizes to its own content and stays
  together — the coverflow needed the width, the info row didn't. (2) Its
  internal image index wasn't resetting when a *different* product was
  selected via a list-row click — the component instance was reused, so a
  stale index from a previously-viewed product (e.g. index 2) could exceed a
  newly-selected product's actual image count, rendering a blank coverflow,
  and even in-bounds it violated "the large center image is always what's
  shown first." Fixed with `key={product.href}` at the call site, forcing a
  fresh mount per product — simpler than syncing internal state, and correct
  here since nothing animates *between* different products (only paging
  within one product's own photos does). (3) Two real sticky-positioning bugs,
  both confirmed by scrolling live rather than guessed: `top-10` left a 40px
  gap between the viewport edge and the pinned block, through which
  scrolled-out list rows could visually peek as they passed behind it — fixed
  via `top-0`. Separately, the sticky spotlight's containing block had been
  the *entire* content column (which also holds the mobile pagination dial),
  so it stayed pinned all the way through the dial too, visually colliding
  with it — fixed by wrapping just [sticky spotlight+divider, ProductList] in
  their own shared container, so the sticky release point is the end of the
  list, not the end of the whole column.
- **New `ProductSpotlight` component built** (2026-08-28) — Figma node 596:600
  ("imageGallery"), sitting above the repeated list rows; `ProductList`'s own
  file comment had already flagged this node as unbuilt. Behavior per the
  user: switching Shop to list/gallery layout auto-selects `products[0]` into
  this featured section; clicking any row below re-selects which product feeds
  it (`ProductCard`'s row layout gained an `onSelect`/`selected` prop pair —
  when set, the row renders a selecting `<button>` instead of a navigating
  `<Link>`, since a `<button>` inside an `<a>` would be invalid markup anyway)
  rather than navigating to the PDP — the spotlight's own "Details" pill
  (`BadgeInfoIcon`) is the one real link out. The image row is a coverflow of
  *that one product's* photos (immediate neighbors only, distance ≤ 1,
  regardless of how many photos exist — matches the reference screenshot's
  exact 3-tile look; the dot `Indicator` is what conveys true count/position),
  chevrons on desktop (reuses `SectionCarouselNav`), a plain touch-delta swipe
  on mobile (no library). Spotlight + a horizontal `Divider` under it are
  `sticky` together as one `bg-background` unit so scrolling the list below
  never scrolls them out of view — first attempt used `flex-col` stacking on
  mobile assuming a real overflow existed there; the user corrected that there
  wasn't one and it just looked packed-left, so that got reverted back to the
  original side-by-side split.
- **Real horizontal-overflow bugs found and fixed while building the above**
  (2026-08-28, all confirmed via `document.documentElement.scrollWidth` /
  per-element bounding-rect checks, not eyeballed): (1) `ProductCard`'s row
  layout was missing the `min-w-0` its own card layout already has on the
  `flex-1` content wrapper — a `whitespace-nowrap` price span with nothing
  allowed to shrink below its content size forced the *entire* Shop content
  column ~30-50px wider than the viewport on mobile; added `min-w-0` to the
  wrapper and to `ProductInfo` itself (shared by both layouts). (2)
  `ProductSpotlight`'s own price row had `whitespace-nowrap` per price but
  never got the matching `flex-wrap` fallback `ProductCard`'s price row has —
  same class of bug, fixed the same way. (3) `ShopControlsBar` genuinely
  didn't fit three groups (Sort/Filter-trigger/Layout) in the mobile width
  budget after last pass's Filter-trigger addition — tightened `SortToggle`/
  `LayoutToggle`/the Filter trigger's internal gaps for mobile only (desktop
  gaps unchanged). (4) `ProductSpotlight`'s coverflow neighbor tile spilled a
  few px past its own container at the sizing originally chosen — tightened
  `NEIGHBOR_SIZE`/`OFFSET_X_STEP`. Net result: 55px → 0px measured overflow.
- **Shop mobile filter drawer + desktop sidebar layout fixes** (2026-08-28):
  desktop had no way to see the price filters were shared/consistent with
  mobile, and mobile had *no* way to filter at all (ShopSidebar is `hidden`
  below `md`). Extracted the "Filter" header + Price section out of
  `ShopSidebar` into a new shared, fully-controlled `PriceFilterPanel`
  (`src/components/price-filter-panel.tsx`) — state (`activePriceRange`,
  `customPriceOpen`, `minPrice`, `maxPrice`) now lives in `ShopPage` itself
  instead of locally in `ShopSidebar`, so both the desktop sidebar and a new
  `MobileFilterDrawer` (same overlay/slide-in pattern as `MobileNavDrawer`)
  drive the identical state. `ShopControlsBar` gained a mobile-only "Filter"
  trigger (icon + vertical divider + label, matching the exact row already
  inline in the desktop sidebar) that opens the drawer; the icon "fills" when
  `hasActivePriceFilter()` is true. Since Hugeicons' free `FilterHorizontalIcon`
  is stroke-only, this works by passing `Icon` a new optional `fill` prop
  (added to `src/components/ui/icon.tsx`, safely spread only when explicitly
  set so every other icon keeps its default outline-only `fill:none`) —
  `FilterHorizontalIcon` happens to have two closed "slider handle" sub-paths,
  so filling them renders solid while its other line-segment paths are
  visually unaffected (fill has no effect on a path with no enclosed area).
  Separately: added a vertical `Divider` between the sidebar and the product
  content (desktop only, all layouts), and made the sidebar `sticky` (position:
  sticky, `self-start`, `top-10`) instead of scrolling away with the grid/list.
  This surfaced a real latent bug in `Divider` itself: a *vertical* divider
  with `length` omitted defaulted to `height: 100%`, which doesn't reliably
  resolve against a flex container whose own height is content-driven/auto
  (confirmed via a bounding-rect check — it rendered at 0 height) — no
  existing caller had ever hit this since all of them passed an explicit
  `length`. Fixed by relying on `align-self: stretch` instead when vertical +
  no length; horizontal's `width: 100%` default was untouched (percentage
  widths don't have this problem). Sticky itself was verified correct (engages
  at `top: 40px` once scrolled far enough, releases at the bottom of its own
  row) — with only 6 placeholder products the row is short so it releases
  early; a real catalog's much taller row will keep it stuck throughout.
- **Shop page grid is now responsive** (2026-08-28): was a single `ProductGrid`
  at the default 2 columns for every breakpoint, including desktop. Split into
  two (`columns={4} className="hidden md:grid"` / `columns={2}
  className="md:hidden"`), same pattern `ProductCollectionSection` already
  uses. Mobile grid pagination now reuses `CategoryDial`'s horizontal z-axis
  coverflow (same component/mechanic as `CelebrityShowcase`'s mobile @handle
  picker) with page numbers as labels instead of a separate component, for
  *both* layout modes (grid and gallery/list) — desktop keeps the original flat
  `PaginationDial`, also for both layouts.
- **Root cause found for several "my fix didn't seem to apply" moments**
  (2026-08-28): `cn()` (clsx + tailwind-merge) was configured with plain
  `twMerge`, which only knows Tailwind's *own* default `text-*` size scale
  (text-sm, text-lg, ...) — it had no idea this project defines a custom one
  (text-h1-h6, text-display, text-body-*, text-eyebrow, text-card-title,
  text-price). Any `cn()` call combining a custom size class with a `text-*`
  color class (e.g. `cn("text-display", ..., "text-brand-primary")`) got
  misread as two conflicting text-color utilities, and tailwind-merge silently
  dropped the size class — confirmed by inspecting the actual rendered
  className, which was missing "text-display" entirely even though the source
  had it. Fixed in `lib/utils.ts` via `extendTailwindMerge` registering those
  tokens under the `font-size` group. This was *not* a fluke specific to this
  session's nav-link bump — any earlier size bump applied through `cn()`
  (rather than a plain template-literal className) was at risk of having been
  silently no-op'd this whole build; worth a skim of past size-related fixes if
  something still looks wrong.
- **NavBar's active-link state was hardcoded** — `activeHref` defaulted to `"/"`
  with no caller ever passing the real path, so the active link was stuck on
  "Home" on every page. Fixed by deriving it from `usePathname()` inside NavBar
  (already a Client Component) instead, with the prop kept as an explicit
  override.
- **NavBar/MobileNavDrawer link text bumped to `text-display`** (96px, the top
  of the type scale) per the user asking for it "much much bigger... 5x" —
  previous bumps (h4→h2) were real but modest; this is deliberately the largest
  token available, same size on both. See the tailwind-merge bug above for why
  earlier bumps may not have visibly taken effect.
- **`Button`'s horizontal padding bumped to 4x the Figma default** (24px vs the
  original 6px-all-sides), vertical padding unchanged — added `paddingX`/
  `paddingY` props (uniform `padding` still wins over both if passed) since the
  component previously only supported one uniform padding value.
- **`TestimonialSection` rebuilt from scratch against a real Figma screenshot**
  (2026-08-28) — the previous version (one testimonial's hero + up to 4
  *supporting* photos of the same person) didn't match Figma's actual layout at
  all: a filmstrip of *different* testimonials' single photos, previous person
  peeking in cropped on the left, active person's photo large and central, their
  info immediately beside it, next one or two people's photos smaller on the
  right. Data model changed from `images: {src,alt}[]` (5 per testimonial) to
  one `image` per testimonial. Animation re-confirmed by the user after the
  first version only did an in-place scale-pulse: clicking a chevron needs the
  old hero to visibly shrink/slide into a thumbnail slot while the adjacent
  thumbnail visibly grows/slides into the hero slot — a real shared-element
  transition, not just a resize. Implemented with GSAP's Flip plugin (bundled
  in the installed `gsap` 3.15, free since GSAP/Webflow made all plugins
  public): every visible photo keeps a stable `key`/`data-flip-id` by
  testimonial id (this is load-bearing — without the `key`, React swaps props
  on whichever DOM node sits in a fixed slot instead of literally moving the
  same node, and Flip has nothing real to animate between), `Flip.getState`
  captured right before the index changes, `Flip.from` animates the delta after
  React re-renders with new roles; `onEnter`/`onLeave` fade elements that
  enter/exit the visible window. Verified end-to-end via Playwright screenshots
  at each animation phase (before/mid/after a chevron click), not just eyeballed.
  Mobile (single photo, no neighbors to swap with) keeps the original simple
  in-place scale+fade tween. Collage percentages are approximated from the
  screenshot, not measured — flag if still off.
- **Star rating now actually fills** — Hugeicons' free-tier `StarIcon` is
  stroke-only (confirmed by diffing its path data against `Star`, identical,
  no fill variant exists in this icon set), so recoloring it per the previous
  implementation could never look "filled," only change the outline color.
  Replaced with an inline SVG reusing that exact star path, toggling
  `fill="currentColor"` vs `fill="none"` per star based on rating.
- **Back-to-top button wasn't reaching true scroll-0 on mobile** — a plain
  `scrollTo({top:0, behavior:"smooth"})` can undershoot slightly on mobile
  browsers whose dynamic address bar resizes the viewport mid-animation. Now
  also forces an instant `scrollTo(0,0)` ~500ms after the smooth call;
  confirmed via Playwright that `window.scrollY` reaches exactly 0.
- **Footer's chain image wasn't bleeding out over the card's top edge** like
  the Figma reference — the card had `overflow-hidden`, which silently clipped
  the intentionally-oversized/offset chain image instead of letting it bleed.
  Removed `overflow-hidden` from the card (its `rounded-md` background/border
  don't need it to render rounded — that only affects whether *children*
  clip). The user has been independently tuning the exact bleed amount
  (`-top-10` → `-top-40`) directly in the file; left as-is.
- **Every clickable element gets `cursor: pointer` on hover** — Tailwind v4's
  preflight doesn't set it on `<button>` (browsers default buttons to
  `cursor: default`, unlike `<a>`, which already gets pointer natively; this
  was a deliberate Tailwind v3+ change many teams patch back). Added one
  `@layer base` rule (`button:not(:disabled), [role="button"]:not(:disabled)`)
  in `globals.css` instead of adding `cursor-pointer` to every button
  individually — confirmed via computed-style checks across NavBar, ProductCard,
  SectionCarouselNav, etc.
- **Fourth pass — CategoryDial's mobile horizontal orientation rebuilt as a real
  depth-stacked coverflow** (2026-08-27), after two wrong guesses: attempt 1 just
  contained the row in `overflow-x-auto` (fixed the page-overflow bug below, but
  the active pill's font was measured for the spacious desktop dial and alone was
  nearly the full mobile card width — no room to see more than one item at a
  time). Attempt 2 misread "arc on the z-axis" as a literal 2D curve (`translateY`
  droop + `rotate`) — corrected by the user: they meant an actual coverflow, the
  active item centered and frontmost at full size, each neighbor sitting *behind*
  the one closer to center (overlapping, descending z-index), shrinking/blurring
  with distance, only the near half of items 2+ steps out visible before they're
  occluded. Rebuilt as absolutely-positioned items centered in a fixed-height
  strip, offset by a fixed step × signed distance from center, clipped by the
  strip's own `overflow-hidden` — verified via Playwright at both the first
  celebrity (neighbors only on one side, correct) and a middle one (neighbors
  stacked on both sides, correct). Desktop's vertical dial is untouched. Also:
  the mobile media-pager chevron under the `MediaTile` grid was disappearing
  entirely whenever the selected celebrity had ≤2 media items (nothing to page)
  — per the user it should read as a persistent control, not one that vanishes
  depending on selection, so `SectionCarouselNav` gained a `forceVisible` prop
  (default off, so every other caller's hide-when-unusable behavior is
  unchanged) and `CelebrityShowcase` sets it — the buttons still disable
  correctly via `onPrev`/`onNext` being `undefined`.
- **Overlapping-glyph symptom** ("BESTSELLERS"/"MEETS PRECISION"/"@CELEBRITY1"
  rendering with visibly overlapping letters, confirmed via real screenshots) —
  root cause is still open. A pass on 2026-08-27 traced it to `Quinn-Bold.otf`'s
  kern table and added a global `.font-heading { font-kerning: none; ...}` rule
  in `globals.css`, verified clean via Playwright — but the user says directly
  that kerning "was never the problem" and removed the rule themselves (it's not
  in `globals.css` as of this pass). Don't re-add that rule without the user's
  go-ahead; if the symptom comes back, the real fix is still unknown.
- `ProductCard`'s mobile spacing tightened (`ProductGrid` gap 20px→10px below
  `md`, `ProductCard`'s own padding 15px→10px below `md`) and the price/
  compare-price row now wraps as a whole unit (`flex-wrap` + `whitespace-nowrap`
  per price) instead of breaking mid-string or — a regression caught mid-fix via
  a Playwright screenshot, not apparent from code review — overflowing into the
  basket icon on desktop.
- **Playwright's Chromium binary is now installed locally** (`npx playwright
  install chromium`, 2026-08-27) — several fixes this pass turned out wrong on
  first guess when reasoned from code + user screenshots alone (see the dial
  rebuild above, which took two wrong guesses before an actual browser check +
  the user's correction got it right). Going forward, prefer spinning up
  `npm run dev` + a quick Playwright script to screenshot the real rendered page
  (mobile *and* desktop) before/after a UI fix, rather than reasoning from code
  alone — cheap now that the browser is already installed.
- **Second QA-pass fix (ProductCard/CategoryCollage)** (2026-08-25): `ProductCard`'s
  "card" layout had a real structural bug — `AddToBasketButton` was absolutely
  positioned to the card's bottom-right corner while the info block above it had no
  matching bottom padding, so the card's flow height and the button's fixed inset
  didn't line up, leaving a large dead gap between the price line and the card edge
  (confirmed against a Figma screenshot showing the button sitting tight beside the
  price, not floating below it). Rewritten: the button is no longer absolute — it's
  now a flex sibling of a second `Link` (wrapping just `ProductInfo`) in a
  `items-end justify-between` row, so the card simply hugs its content height. Split
  into two `Link`s (image, info) instead of one wrapping both, since the button must
  stay a sibling of `Link`, not nested inside it (a `<button>` inside an `<a>` is
  invalid/inaccessible markup) — this was already true before, just re-confirmed
  while restructuring. Also: card corner radius is now responsive (`rounded-sm`/8px
  on mobile, `rounded-md`/16px on desktop — 16px read oversized on the narrow mobile
  card per the user); the category label inside `ProductInfo` shrinks to `text-h5`
  (20px) below `md` (was a fixed 32px that overflowed/wrapped badly on a ~150px-wide
  mobile card). `CategoryCollage`'s tile label bumped `text-h6`(16px)→`text-h4`(28px)
  — a real screenshot showed it clearly larger than the h6 guess. All flagged as
  best-effort screenshot-based sizing, not confirmed Figma measurements (access still
  down) — ask again if any still look off.
- **First real user QA pass on Home** (2026-08-25) surfaced a genuine implementation
  bug: the Hero/Footer "Shop now" buttons were built with real measured Figma values
  documented (458×110/70px text for Hero's node 557:3730, 287×110/70px for Footer's
  557:4937) but never actually *applied* at the call site — both used Button's
  generic small defaults instead, rendering thin and undersized. Fixed both with
  their real measured values (Footer's uses `clamp()` for the text size instead of
  a fixed px, since that card scales responsively and a fixed 70px would look
  oversized on mobile — Hero's button only renders at the `md` breakpoint so a
  fixed value is fine there). Also bumped, without confirmed Figma numbers behind
  them (still rate-limited) but based on direct screenshot comparison: NavBar/
  MobileNavDrawer link text (28px→48px, `text-h4`→`text-h2`, explicitly *beyond*
  Figma's own spec per an accessibility request, not a fidelity fix), the "Buy once,
  wear forever" headline and `SectionHeader`'s `title` (both `text-h3`→`text-h2`,
  30px→48px), and `SectionHeader`'s "View all" button (16px→22px text, 49px→51px
  height — was disproportionately thin in its pill). All flagged as best-effort
  pending real Figma confirmation; ask again if any still look off.
- **Clerk is actually connected now** (2026-08-25): a pasted generic Clerk-CLI setup
  playbook conflicted with the already-built single-admin model (it assumed public
  sign-up/sign-in for all visitors) — user chose to keep single-admin and skip both
  the public auth UI and `clerk init`'s auto-scaffold (which risks overwriting the
  working middleware/provider/sign-in route). Instead: `clerk auth login` →
  `clerk link --app app_3IOgUhYQq9sD6hKqjVzqoa3vuMU` (confirmed named "PlugGeo",
  the right app) → `clerk env pull` into `.env.local` (merged cleanly, didn't touch
  other vars). Clerk app config was also live-patched to actually match
  `docs/AUTH.md`: password auth and email-code sign-in were enabled by default
  (Google was already the only *OAuth* provider) — disabled both via
  `clerk config patch`, confirmed with `--dry-run` first.
- **Two real pre-existing bugs found and fixed** while verifying against Clerk's own
  setup rules: `ClerkProvider` was wrapping `<html>` instead of sitting inside
  `<body>` (violates Clerk's own documented rule), and `src/proxy.ts`'s matcher was
  missing `'/__clerk/:path*'` after the api/trpc entry. Both existed since initial
  scaffolding, unnoticed until this pass.
- `ADMIN_EMAIL` in `.env.local` is still empty — still needs a real value before
  `/admin` is actually reachable (`requireAdmin()` throws if it's unset).
- **Brand name**: Plug Geo (confirmed 2026-08-24 — an earlier voice-dictated "Plug Deal"
  was a transcription error).
- **Scope**: checkout/cart/orders/payments are explicitly OUT — catalog/showcase site
  only. `orders`/`order_items` tables removed from the schema.
- **Figma access**: no Dev Mode seat (free plan), so no official Figma MCP/Code Connect
  at first — built a REST API + personal access token pipeline instead (`FIGMA_TOKEN`/
  `FIGMA_FILE_KEY` in `.env.local`, see `docs/FIGMA_MAPPING.md`). A separate
  `claude.ai Figma` MCP connector later became available in-session
  (`get_screenshot`/`get_metadata`/`get_design_context`) and is now used alongside the
  REST pipeline for visual/structural ground truth on large or ambiguous frames —
  the REST pipeline is still used for precise numeric/style extraction.
- **Icons**: Hugeicons (`@hugeicons/react` + `@hugeicons/core-free-icons`, free tier).
  Every icon used so far has matched a real Hugeicons export by name exactly — the
  designer used real Hugeicons throughout, so icon names in Figma layer names are a
  reliable lookup key.
- **Fonts**: Quinn (heading, local `.otf`, Bold weight only so far) via
  `next/font/local`; Inter (body) via `next/font/google`. Both wired in `layout.tsx`.
- **Line-heights**: measured, not guessed — Quinn is a consistent 1.4× ratio at any
  size, Inter is a consistent ~1.21× ratio at any size/weight (font-intrinsic
  constants). Applied uniformly across the type scale in `globals.css`.
- **Site-wide padding**: 24px mobile / 40px desktop on every storefront page, applied in
  `(storefront)/layout.tsx`. `Footer` is the one exception — full-bleed, no padding.
- **Page background is white, not navy** (fixed 2026-08-25): `--background`/
  `--foreground` in `globals.css` were originally set to navy/white (a guess made
  before any real components existed). Every real component pulled since then assumes
  black/navy foreground on a white ambient background (NavBar's navy active link/
  icons, black borders on chips/search, etc.) — navy-on-navy made NavBar functionally
  invisible on the page background. Corrected to `--background: surface-primary`
  (white) / `--foreground: text-primary` (black); navy/black dark blocks (hero
  images, Footer's promo card) are intentional accent sections *within* the white
  page, not the page's own background. If NavBar/text/icons ever look invisible again,
  check this first.

## Design system corrections since the first pull

- 3 new type tokens discovered from real components (not in the original Variables
  pull): `text-eyebrow` (24px Inter Light), `text-card-title` (20px Inter Regular),
  `text-price` (22px Inter Medium).
- `--shadow-drop` confirmed in real use (Product Card, Button) — no longer flagged.
- `products.compareAtPrice` column added — confirmed necessary by the real Product Card
  design (sale price + strikethrough original price).

## Component inventory

Legend: 🟢 built from a real Figma node · 🔵 self-designed (no Figma ref, per user
direction) · 🟡 built + later generalized/merged into another component.

| Component | File | Figma node | Notes |
|---|---|---|---|
| Button | `components/ui/button.tsx` | 557:3730 | Height/width/textSize/padding are props, not a fixed size scale — Figma's instance was an oversized hero-CTA example |
| Icon | `components/ui/icon.tsx` | — 🔵 | Hugeicons wrapper, project convention entry point |
| Skeleton | `components/ui/skeleton.tsx` | — 🔵 | `motion-reduce:animate-none` |
| Tooltip | `components/ui/tooltip.tsx` | — 🔵 | Base UI-backed (`@base-ui/react/tooltip`) |
| Divider | `components/ui/divider.tsx` | — 🔵 | Gray token, 1px (`--border-width-thin`), variable length |
| Spinner 🟡 | `components/ui/spinner.tsx` | 557:5091 | Rebuilt 2026-08-28: 5 bars now bounce independently via GSAP (springy, staggered/out-of-phase) instead of the whole shape spinning as a unit. App-wide loading indicator for anything that isn't a product-card grid |
| ProductCardSkeleton / ProductGridSkeleton | `components/ui/product-card-skeleton.tsx` | — 🔵 | Shimmer placeholder matching ProductCard/ProductGrid exactly — the app-wide rule for product-card loading states specifically (Spinner covers everything else) |
| SearchInput | `components/ui/search-input.tsx` | 557:5083 | Icon + vertical Divider + input, black border pill |
| SearchOverlay | `components/search-overlay.tsx` | — (built from a pasted screenshot) | Dismissible search panel (SearchInput + ProductLineItemCard list), opened from NavBar's desktop icon or MobileNavDrawer's icon |
| ProductLineItemCard 🟡 | `components/product-line-item-card.tsx` | — (built from a pasted screenshot) | Generalized from SearchResultCard once `/bag` needed the same row with a "Remove" action instead of "Add to bag" — image/title/category/variant summary/price + QuantityStepper + a configurable action pill |
| QuantityStepper | `components/ui/quantity-stepper.tsx` | — (built from a pasted screenshot) | Decorative-only −/+ quantity control, shared by SearchResultCard (both breakpoints) and ProductDetailSection (above "Add to bag") |
| PaginationDial | `components/ui/pagination-dial.tsx` | 557:4754 | Distance-based size/radius/blur, shares math with CategoryDial via `lib/coverflow.ts`. Blur made symmetric (Figma's was asymmetric — read as inconsistent, not intentional) |
| CategoryDial | `components/ui/category-dial.tsx` | 557:4412 | Coverflow text-label picker, shares `lib/coverflow.ts` with PaginationDial. `orientation` prop (vertical default, horizontal added for CelebrityShowcase's mobile layout) — same component for both, not a duplicate. No longer forces `capitalize` (broke "@handle"-style labels) |
| LayoutToggle | `components/ui/layout-toggle.tsx` | 557:4197 | Grid/gallery toggle. Selected state = gray filled chip (free Hugeicons has no filled icon variant) |
| SortToggle | `components/ui/sort-toggle.tsx` | 557:4383 | Asc/desc, gray filled chip when active (color confirmed from a 2nd instance in shopControlBar) |
| Pill 🟡 | `components/ui/pill.tsx` | 557:3737, 557:4829/4827, 596:618-624 | Generalized with `active` prop — hashtag pills, variant-selector chips, and price-filter chips are all the same Figma "chip" component |
| Indicator | `components/ui/indicator.tsx` | 557:4670 | Image-count dots, wired into ProductCard |
| ImageThumbnail 🟡 | `components/ui/image-thumbnail.tsx` | 557:4783 | Rebuilt 2026-08-28 against a real PDP screenshot — wasn't actually wired into any page until PDP was built, so freely redesigned: one shared card frame around a landscape main image + 3 thumbnails in a tight row, not two separate blocks |
| ProductDetailSection | `components/product-detail-section.tsx` | — (built from pasted screenshots) | PDP's first section — ImageThumbnail beside category/title/price/description/"Add to bag" (reuses ProductSpotlight's exact button, not a new one) |
| ProductCustomize | `components/product-customize.tsx` | — (built from pasted screenshots) | PDP's collapsible variant selector (Size/Width/Gold color/Gold type), sits under "Add to bag" — Pill + Divider only, no new visual primitives |
| RelatedPiecesSection | `components/related-pieces-section.tsx` | — (built from pasted screenshots) | PDP's second section, "More From The Plug" — SectionHeader + responsive ProductGrid + "Explore more" CTA |
| ImageCarousel | `components/ui/image-carousel.tsx` | 596:597 ("imageGallery") | Depth-blurred 3-up carousel; chevron controls below-right are the user's own addition, not in Figma |
| BackToTopButton | `components/ui/back-to-top-button.tsx` | 557:4950 | Glassmorphic (`backdrop-blur`), Hugeicons `PointerIcon` matched the Figma layer name exactly |
| ProductCard | `components/product-card.tsx` | 557:3742, 557:4670 | `layout: "card" \| "row"` prop (not two components) — Shop's gallery-mode row reuses the same info block. Row image scaled down from a measured 341px (felt too large for a list row — flagged). `layout="card"` scales up on hover (`hover:scale-105`), the one exception to the app-wide hover-fade rule; `layout="row"` (the list under ProductSpotlight) keeps the default fade, per the user |
| ProductGrid | `components/product-grid.tsx` | 594:574 | Grid of ProductCard(layout="card"); `columns` prop (default 2) — Home's Bestsellers section reuses it at `columns={4}` instead of a duplicate component |
| ProductList | `components/product-list.tsx` | 596:600 (lower half) | Vertical stack of ProductCard(layout="row") |
| NavBar | `components/nav-bar.tsx` | 566:6255 | Reworked per user spec (not the raw node layout): desktop centers logo+links in viewport with search/basket far right; mobile centers logo with a 48×48 menu-03 button opening MobileNavDrawer |
| MobileNavDrawer | `components/mobile-nav-drawer.tsx` | 592:536 | Opens only from NavBar's mobile menu button |
| Footer | `components/footer.tsx` | 557:4930 | Dark promo card (CSS gradient, not the raster image Figma used) + copyright row + BackToTopButton. Full-bleed — the one component exempt from site padding |
| ShopControlsBar | `components/shop-controls-bar.tsx` | 596:602 | Composes SortToggle + LayoutToggle, nothing new |
| ShopSidebar | `components/shop-sidebar.tsx` | 596:644 | CategoryDial + filter header + Pill(active) price chips + custom-price disclosure + min/max inputs. Desktop-only (Figma node was named "shopDesktopSidebar", no mobile variant given yet) |
| HeroSection | `components/hero-section.tsx` | 598:653 (desktop), 602:656 (mobile) | Desktop: static 3-col photo collage (real photography in `public/hero/`), Button below the image. Mobile: swipeable through all 5 collage photos via `HeroMobileCarousel`, Indicator tracks the active slide — confirmed by the user, not a guess |
| HeroMobileCarousel | `components/hero-mobile-carousel.tsx` | 602:656 | Native scroll-snap (no gesture library), scroll position drives the Indicator. Only client-side piece of the hero — HeroSection itself stays a Server Component |
| SectionHeader | `components/section-header.tsx` | 603:658 (desktop), 612:665 (mobile) | Title + optional subtitle + optional "View all"/chevron nav — all independently optional. **Mobile layout corrected 2026-08-25** against a real screenshot (had been guessed from a verbal description, guessed wrong): "View all" stays inline next to the title on mobile too; only the chevron nav hides inline and relocates below the section's content via the exported `SectionCarouselNav`. Subtitle sits inline on desktop, drops to its own line on mobile |
| ProductCollectionSection | `components/product-collection-section.tsx` | — (built from a real screenshot, "Bracelet/Pendant Collection") | SectionHeader + ProductGrid, reused for Bestsellers/Bracelet Collection/Pendant Collection instead of copy-pasting the block per section. Desktop: static 4-col grid. Mobile: real 2-item paginated window via the chevron (confirmed by screenshot — not just a reflowed grid). Desktop's inline chevron doesn't page anything yet (flagged) |
| CategoryCollage | `components/category-collage.tsx` | — (built from pasted screenshots, not a Figma node/link) | Replaced CategoryDial on Home's "Our categories" section. Desktop: asymmetric bento grid (CSS grid-template-areas) of 6 category tiles + a copy block; mobile: single stacked column. Placeholder image on every tile per the user. `CategoryDial` itself wasn't touched/removed — still used by ShopSidebar |
| CelebrityShowcase | `components/celebrity-showcase.tsx` | — (built from pasted screenshots, not a Figma node/link) | "Worn by your favorite celebs." Two independent controls: CategoryDial (vertical desktop / horizontal mobile) picks the celebrity; SectionHeader's chevron pages that celebrity's media (2 slots visible, enabled only when a celebrity has more than 2). Each media slot can be image or video (video gets a dimmed overlay + `PlayCircleIcon`). Placeholder image + placeholder handles throughout — not real content |
| TestimonialSection | `components/testimonial-section.tsx` | — (built from pasted screenshots, not a Figma node/link) | "What our customers say" — last section before Footer. Chevron (via SectionHeader, no "View all") pages between *testimonials* one at a time. Desktop: hero photo + up to 4 thumbnails in an approximated 3-col/2-row bento (exact positions unverifiable from a screenshot, flagged) beside name/stars/quote; mobile: hero photo only. `StarIcon` is stroke-only (no filled variant) — rating is shown via color (navy vs gray), not a fill/outline swap. **Animated (GSAP)**: data swaps instantly on chevron click, hero image grows into place (scale 0.82→1, opacity fade, `power3.out`, ~0.7s), text fades/settles slightly faster (~0.4s) — gated behind `prefers-reduced-motion` via `gsap.matchMedia()`, cleaned up per the gsap-motion skill. 3 placeholder testimonials now (was 1 — needed a second to make the chevron/animation demonstrable at all) |

Shared/support files: `lib/utils.ts` (`cn`, `toCssLength`), `lib/coverflow.ts`
(distance→size/radius/blur math shared by PaginationDial + CategoryDial),
`lib/motion.ts` (shared ease/duration/stagger tokens for the whole animation
system), `hooks/use-viewport-enter.ts` + `hooks/use-reveal.ts` +
`components/ui/reveal-text.tsx` (viewport-gated entrance primitives),
`hooks/use-dial-wave.ts` (shared stadium-wave dial interaction),
`hooks/use-drawer-transition.ts` (shared mobile-drawer open/close
choreography), `hooks/use-accordion.ts` (shared dropdown/disclosure open/close),
`hooks/use-toggle-pulse.ts` (shared toggle-button state-change confirmation),
`components/bag-flight-provider.tsx` + `components/ui/add-to-bag-button.tsx`
(flying Add-to-Bag icon system).

## Pages

| Route | Status |
|---|---|
| `/` (Home) | **Fully built**, top to bottom, real (mobile+desktop), placeholder data: HeroSection → promo strip → Bestsellers → Our categories (SectionHeader + CategoryCollage) → CelebrityShowcase → Bracelet Collection → Pendant Collection → TestimonialSection → Footer (shared layout). No more scratch/showcase content on this page |
| `/shop` | Real integration: ShopSidebar + ShopControlsBar + ProductGrid/ProductList toggle + PaginationDial + ProductSpotlight (list layout), placeholder product data |
| `/grillz` | Hero (real images, back button, full-bleed) → Best Grillz Collection (ProductCollectionSection) → GrillzCastSection → Footer. Placeholder product data |
| `/category/[slug]` | Real (placeholder-data) integration, built purely from existing components: SectionHeader + ProductGrid + pagination dial + "More from us" + Explore more Button. Shares NavBar's back-button variant with Grillz. Has a ProductGridSkeleton-based `loading.tsx` |
| `/product/[slug]` | First section built (real, placeholder-data): image gallery + category/title/price/description/"Add to bag". Shares NavBar's back-button variant with Grillz/category/bag. Has a Spinner-based `loading.tsx` |
| `/bag` | "My shopping bag" — real local state (quantity/remove work, subtotal recalculates), placeholder-seeded, no persistence/checkout — see its resolved-decision entry for the scope boundary. Shares NavBar's back-button variant with Grillz/category/product |
| `/admin` | Still a placeholder stub |

## Assets pulled from Figma

`public/logo.png` (main nav logo), `public/logo-mark.png` (small footer wordmark),
`public/footer-chain.png` (footer product photo), `public/hero/*.png` (5 real hero
collage photos), `public/placeholder-product.svg` (local placeholder, not from Figma).

## Flagged / worth confirming (not blocking)

- **`e2e/home.spec.ts` fails against current markup** — asserts a heading with
  the text "Plug Geo" is visible on `/`, but that text only ever appears as
  image `alt`/`aria-label`, never as a real heading anywhere in the app.
  Confirmed pre-existing (not touched by the animation pass that surfaced it
  during the full verification gate) — either the test or the markup needs a
  decision, not obvious which was intended.
- Basket icon behavior (ProductCard's add-to-basket, NavBar's basket link) is
  unconfirmed — there's no checkout in scope, so it's likely a wishlist/inquiry action,
  not a real cart. Currently inert.
- Footer's background is a CSS gradient approximation of Figma's raster image fill.
- ProductCard row-layout image size was scaled down from a measured 341px.
- ShopSidebar has no mobile variant yet.
- `label` Figma text style still unconfirmed as canonical (per the user's rule that
  styles need confirmation, unlike variables) — not implemented, not blocking.
- Quinn only has a Bold weight file — other weights aren't available yet if a future
  frame calls for them.
- A handful of measured values don't land on named tokens and were used as literal
  arbitrary values instead of force-rounded — each flagged inline in the component
  that uses it (e.g. ProductCard's 15px/41px, ProductGrid's 38px row gap).
- **Both Figma access paths went down for an extended period** this session — REST
  returned `429` for 15+ minutes across retries and eventually recovered on its own;
  the `claude.ai Figma` MCP connector's "Starter plan tool call limit" has *not*
  recovered across multiple checks spanning a long stretch of this session, so
  treat it as a hard plan-level cap rather than a rolling window worth re-polling
  often. The user's workaround — pasting screenshots directly — worked well and is
  now the default when a fresh node needs describing; treat a pasted screenshot
  with the same rigor as Figma data (measure/infer carefully, flag approximations),
  and say so plainly when there isn't enough to go on (as happened for a verbal-only
  description of SectionHeader's mobile layout, which turned out to be *wrong* once
  a real screenshot arrived — see the SectionHeader entry above).
- The mobile product-grid reference (611:662, an early Figma link) is still
  unaddressed.
- CategoryCollage's bento grid proportions (desktop) and its corner arrow icon
  (`ArrowUpRight03Icon` — the user corrected this from an earlier `01Icon` guess,
  presumably checking against Figma directly) are approximated from pasted
  screenshots, not measured. Every tile uses the placeholder image, per the user,
  pending real category photos.
- CelebrityShowcase's celebrity handles are placeholder labels (`@CELEBRITY1` etc.),
  not real ones — the screenshot showed real-looking handles but the user didn't
  confirm them as real data to use.
- TestimonialSection's desktop photo collage (hero + 4 thumbnails) is an
  approximated 3-col/2-row bento, not a pixel match — exact thumbnail positions
  aren't verifiable from a screenshot.

## Next up

Home, Shop, Grillz, the generic category template, and PDP's first section are
built, and the whole storefront now has a systemic animation/micro-interaction
layer (page transitions, entrances, the dial wave, flying add-to-bag, drawers,
search/PDP stagger, icon micro-interactions). Not yet directed on what's next —
likely the rest of the PDP (below the first section), admin CMS, or
per-category/per-product real data/photos to replace placeholder content.
611:662 (mobile product grid reference) is still open whenever Figma access
recovers or gets screenshotted. `e2e/home.spec.ts`'s failure (see Flagged,
above) is worth a decision before it's mistaken for a regression later.
