# Admin CMS

One user (the admin), signed in via Google through Clerk. This is the only authenticated
surface in the app.

## What the admin manages

- **Products**: create, edit, delete. Name, description, price, category, variants
  (material/size/chain length etc.), images, publish/unpublish status.
- **Images**: upload and reorder per product.
- **Categories/collections**: grillz, watches, sets, bracelets, chains (confirm full list
  against Figma) — create/edit, display order.
- **Homepage & page curation**: choose which products/collections are featured and where,
  across the homepage and other semi-dynamic pages.

No order management — there's no checkout in scope (see [CLAUDE.md](../CLAUDE.md)).

## UX notes

- This is a CMS for one power user, not a multi-user admin panel — no need for activity
  logs, permission scopes, or approval workflows.
- Should feel fast for bulk/frequent catalog updates (the admin is expected to update
  products and homepage curation regularly).
