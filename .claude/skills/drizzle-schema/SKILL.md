---
name: drizzle-schema
description: Use when changing db/schema.ts or writing database queries. Drizzle/Neon conventions, migration discipline, and query patterns for this project. Consult for any db/** work or a Server Action that queries the database.
---

# Drizzle / Neon conventions

See `docs/DATABASE.md` for the entity list and rationale. This file is about *how* to
work with the schema day to day.

## Rules

- After any `db/schema.ts` change, run `npm run db:generate` and commit the generated
  migration — don't let the schema file and migrations drift apart.
- UUID primary keys throughout (`defaultRandom()`), consistent with the existing tables
  — don't introduce a serial/identity column for a new table.
- No multi-tenancy columns (`org_id`, `tenant_id`) anywhere — this is intentionally
  single-tenant (`docs/DATABASE.md`). Don't add them "just in case."
- Fetch related data (product + images + variants) with a single Drizzle relational
  query or an explicit join, not sequential per-row queries in a loop — the Shop/PDP
  pages will be doing this on every request.
- Cascade deletes: `product_media` and `product_variants` already cascade on
  `products` delete — follow the same pattern for any new child table so deleting a
  product doesn't leave orphaned rows.
- The `attributes` JSONB column on `product_variants` is deliberately flexible across
  categories (material/karat/size/chain-length differ per category) — but "flexible"
  shouldn't mean untyped chaos in the application layer. Define a zod shape per
  category context where you read/write it, even though the column itself stays JSONB.
