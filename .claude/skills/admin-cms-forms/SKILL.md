---
name: admin-cms-forms
description: Use when building admin CRUD screens or Server Actions under src/app/admin/** — product/category/image/homepage-curation forms. Validation, error handling, and single-admin UX patterns. Consult for any admin CMS feature work.
---

# Admin CMS forms

The admin is one trusted power user doing frequent catalog updates — optimize for speed
and data integrity, not multi-user complexity (no activity logs, no approval flows, no
permission scopes — see `docs/ADMIN.md`).

## Patterns

- **Validation**: every Server Action gets a zod schema mirroring the relevant
  `db/schema.ts` table. Validate server-side even though the caller is always the admin
  — requests can still be malformed or forged.
- **Auth**: every mutating Server Action re-checks `requireAdmin()` itself — don't rely
  solely on the `/admin` route being gated by middleware (see `security-admin`).
- **Error handling**: Server Actions return a typed result (e.g.
  `{ success: true, data } | { success: false, error }`) so the form can show an inline
  error, rather than throwing and relying on Next's generic error boundary.
- **Slugs**: generate slugs from product/category names on create, enforce uniqueness,
  and let the admin override them — don't silently fail on collision.
- **Images**: validate type/size client-side for fast feedback, and again server-side
  (see `security-admin`) since client checks are bypassable.
- **Destructive actions**: product/category delete needs a confirm step — there's no
  trash/undo in scope, so an accidental delete is unrecoverable.
- **Optimistic UI**: only where it meaningfully speeds up a real repeated workflow
  (e.g. reordering images, bulk publish/unpublish) — don't add it by default for simple
  single-record forms where a normal submit/redirect is simpler and less error-prone.
