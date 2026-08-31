# Database

Neon (Postgres) + Drizzle ORM. Single-tenant — one admin, no orgs/teams, no
row-level multi-tenancy anywhere in the schema. No cart/order/payment tables — see
"Out of scope" in [CLAUDE.md](../CLAUDE.md).

## Core entities (`db/schema.ts`)

- **product** — name, slug, description, base price, category, status (draft/published),
  featured flag/position (for homepage curation), timestamps
- **product_media** — product_id, type (image/video), url, alt text, sort order.
  Renamed from `product_image` (2026-08-29) once the admin started uploading
  video alongside photos.
- **product_option** — product_id, attribute key (Size, Gold Type, ...), the full list
  of values it comes in (JSONB string array), sort order. What a shopper can pick
  from — completely separate from pricing. Every possible combination across a
  product's options is generated at render time, not stored.
- **product_variant** — sparse: one row per *complete* combination of option values
  that costs or stocks differently from the base product (product_id, attributes —
  a JSONB `Record<string,string>`, one value per key — price override, availability
  flag). A combination with no row here just uses the product's own price and is
  available by default. Reworked 2026-08-31 from an earlier "one row per admin-chosen
  group of values" shape that let two rows both match one shopper selection with no
  way to say which price should win — every row here is always a full combination, so
  a selection either finds its own row or falls back to the base price, never both.
- **category** — watches, grillz, sets, bracelets, chains (+ whatever the Figma file
  confirms), slug, display order

Admin identity comes from Clerk (Google) + an `ADMIN_EMAIL` allowlist check — no
`admin_user` table, no roles/permissions system, since there's exactly one admin.

## Conventions

- Drizzle schema lives in `db/schema.ts` (split under `db/schema/` only if it grows
  large enough to need it)
- UUID primary keys throughout
- Migrations via `drizzle-kit`, committed to the repo
- No soft multi-tenancy columns (org_id, tenant_id) anywhere — this is intentionally
  single-tenant

## Open questions

- Whether availability needs to be quantity-based or is just a publish/unpublish toggle
  (leaning toggle, given the no-checkout scope)
