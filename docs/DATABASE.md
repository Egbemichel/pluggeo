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
- **product_variant** — product_id, variant attributes (material/karat, size, chain
  length, etc. — jewelry attributes differ by category, so kept flexible via a JSONB
  `attributes` column rather than rigid columns per category), price override,
  availability flag
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

- Exact variant/attribute shape per category (needs the real product data or Figma PDP
  layout to confirm what's actually sold as a "variant" vs. a separate product)
- Whether availability needs to be quantity-based or is just a publish/unpublish toggle
  (leaning toggle, given the no-checkout scope)
