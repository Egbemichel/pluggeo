# pluggeo&co — Root Rules

pluggeo&co (confirmed spelling) is a luxury jewelry ecommerce platform (watches, grills,
jewelry sets, bracelets, chains) with a streetwear/rapper-luxury aesthetic. Full build,
no MVP — every v1 feature ships in one pass. Hard deadline: 5 days from project start.

Read the relevant doc(s) below before working in that area. Don't re-derive decisions
that are already written down here or in `/docs` — follow them.

## Progress log — read first, update last

[PROGRESS.md](PROGRESS.md) is the running state of the build: what's decided, what's
built, which Figma node each component came from, and what's still flagged. It's the
fastest way to get oriented — cheaper than re-deriving context from `/docs` or old
chat history.

- **Read `PROGRESS.md` at the start of every task** in this project, before making
  changes.
- **Update `PROGRESS.md` at the end of every task** — new components/pages, decisions
  made, flags resolved or newly raised, "next up." Keep it a current snapshot, not a
  chronological log (that's what `CHANGELOG.md` is for) — edit or remove stale entries
  rather than appending to them.

## Stack (locked)
- Next.js (App Router, TypeScript), single app, deployed to Cloudflare via OpenNext/Workers
- Styling: Tailwind + shadcn/ui, restyled to the pluggeo&co dark/navy palette (navy,
  black, white, gray — no gold/accent color, see `docs/DESIGN_SYSTEM.md`)
- Animation: GSAP for motion/interaction beyond standard CSS transitions
- Data fetching: React Server Components + Server Actions by default; add React Query only
  where client-side interactivity genuinely needs it (e.g. live admin CMS forms)
- API: Next.js Route Handlers + Server Actions only — no separate Workers API layer
  (internal-only API surface, no third-party consumers in v1)
- DB: Neon (Postgres) + Drizzle ORM
- Auth: Clerk, Google sign-in only, single role — Admin. No public customer accounts.
- Theme: dark mode only for v1 (no light mode toggle)
- Testing: Vitest (unit) + Playwright (e2e), cover critical paths (admin CRUD, auth, storefront rendering)
- Environments: local (dev), staging, production. No domain yet — local dev first.
- Changelog: Keep a Changelog format + semver, updated by Claude Code at the end of each
  feature (see `CHANGELOG.md`)

## Docs index
- [PROGRESS.md](PROGRESS.md) — running build state; read first, update last (see above)
- [docs/PROJECT.md](docs/PROJECT.md) — what pluggeo&co is, full feature list, out-of-scope
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — app structure, rendering strategy, deployment
- [docs/DATABASE.md](docs/DATABASE.md) — entities, schema, Drizzle conventions
- [docs/API.md](docs/API.md) — route handlers vs server actions, conventions
- [docs/AUTH.md](docs/AUTH.md) — Clerk setup, admin-only access model
- [docs/ADMIN.md](docs/ADMIN.md) — admin CMS scope and capabilities
- [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) — tokens pulled from Figma (colors/
  type/spacing/radius/blur/border-width), line-heights measured from real components
- [docs/COMPONENTS.md](docs/COMPONENTS.md) — shadcn/ui restyle conventions, icon/font
  system — see [PROGRESS.md](PROGRESS.md) for the actual component inventory
- [docs/FIGMA_MAPPING.md](docs/FIGMA_MAPPING.md) — Figma access workflow (REST API +
  token, plus the `claude.ai Figma` MCP connector for screenshots/metadata)
- [docs/TESTING.md](docs/TESTING.md) — Vitest/Playwright conventions
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — Cloudflare/OpenNext, environments
- [CHANGELOG.md](CHANGELOG.md) — Keep a Changelog log, update every feature

## Out of scope

- **Checkout/cart/orders/payments**: explicitly out of scope for this build. Don't
  scaffold cart state, checkout flows, order tables, or payment integrations. The
  storefront is a catalog/showcase — browsing and product detail only.

## Open decisions (blocking — see chat, not guessed)

None currently. Non-blocking flagged items (behavior needing confirmation, deliberate
simplifications) live in [PROGRESS.md](PROGRESS.md), not here.

## Working rules

- No MVP language, no "phase 2" scoping — build the full v1 feature as specified in
  `docs/PROJECT.md` in one pass.
- Admin access is a flat email allowlist (`ADMIN_EMAILS`, 2026-08-29: two admins), not a
  user/role system — every allowed email gets identical, unrestricted access. Never
  scaffold multi-tenant, org, or role/permission systems.
- Public-facing site has no customer accounts and no checkout — pure browsing.
- Update `CHANGELOG.md` at the end of each feature, not per-commit.

## Skills

Skills live in `.claude/skills/`. They're split into two tiers — don't treat them as
optional reading, this is how quality and business-viability get enforced on a 5-day
build with no room to redo work.

**Global — invoke on every non-trivial code change, no exceptions:**

- `design-tokens` — before writing/reviewing any styling
- `nextjs-architecture` — before writing/reviewing any route or component code
- `accessibility` — before writing/reviewing any UI
- `definition-of-done` — at the END of every task, before calling it finished
- `github-sync` — immediately after `definition-of-done`, to commit and push
  the finished work so `origin/main` stays current after every prompt

**Contextual — invoke when the work touches that area:**

| Skill | Applies to |
|---|---|
| `figma-fidelity` | building/updating any storefront screen from a Figma frame |
| `responsive-parity` | any storefront screen (mobile + desktop both required) |
| `admin-cms-forms` | `src/app/pluggeo/**` CRUD screens and Server Actions |
| `drizzle-schema` | `db/**` changes, any DB query |
| `image-optimization` | product photography, galleries, upload flow |
| `seo-metadata` | any `app/(storefront)/**` page |
| `gsap-motion` | any Client Component using GSAP |
| `testing-conventions` | writing Vitest/Playwright tests |
| `security-admin` | auth, Server Actions, or uploads under `/pluggeo` |
| `performance-budget` | new dependencies, large images, new client-side JS |

Don't invoke every contextual skill on every prompt — that defeats the point. Match them
to what the current change actually touches; several usually apply together (e.g.
building a PDP touches `figma-fidelity`, `responsive-parity`, `image-optimization`,
`seo-metadata`, and possibly `gsap-motion`, alongside all four global skills).
