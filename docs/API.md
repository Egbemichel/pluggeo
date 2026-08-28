# API

Internal-only in v1 — no third-party consumers, no public API surface, no cart/checkout
endpoints (see "Out of scope" in [CLAUDE.md](../CLAUDE.md)).

## Conventions

- **Server Actions** are the default for all mutations from within the app: admin
  product CRUD, image upload, homepage curation.
- **Route Handlers** (`app/api/.../route.ts`) are reserved for cases Server Actions can't
  cover: anything that needs to be hit from outside a form/React tree, or responses that
  aren't a React re-render (e.g. a sitemap.xml).
- Don't build a generic `/api/products`, etc. REST layer — there's no external consumer
  to justify it, and it duplicates what Server Components/Actions already do more
  directly.
- Validate all Server Action input (zod or similar) even though there's a single trusted
  admin — inputs still come from a browser form and shouldn't be trusted blindly.
