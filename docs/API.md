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

## Manual order checkout

The storefront's default checkout is manual order intake, not a payment gateway:

1. Validate customer, method-specific fields, wallet choice, and proof upload.
2. Requote products, options, quantities, and totals from the database.
3. Apply the configured crypto discount to the merchandise subtotal only.
4. Persist the order and item snapshots as pending.
5. Send the order details to the owner through Resend.
6. Show the order number and confirm that the owner will contact the customer on WhatsApp.

Payment methods and their customer fields, instructions, wallets, discounts, sort order,
availability, and screenshot requirement are managed at `/pluggeo/payments`. The checkout
API re-reads the method from the database and never trusts customer-submitted prices or
discounts. The proof upload route accepts JPEG/PNG/WebP images up to 5 MB, and only for an
active method configured to require proof.

Configure `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `ORDER_NOTIFICATION_EMAIL` in the
runtime environment. Existing Card2Crypto and AllPays routes remain available for
integration work, but are not part of the current storefront order flow.
