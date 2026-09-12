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

## Payment providers

Plug Geo supports multiple provider-backed checkout paths through the same order lifecycle.
The shared server flow remains:

1. Validate checkout request
2. Create the local order
3. Recalculate server-authoritative totals
4. Select payment provider from the explicit customer choice
5. Create the provider payment
6. Redirect to the hosted checkout URL
7. Confirm payment via provider callback/webhook

### Card2Crypto

The existing Card2Crypto flow remains intact and continues to work with the same order
creation path unless the customer selects a different provider.

### AllPays

AllPays is added as a second provider behind the same order workflow. The server creates
an AllPays payment from the stored order data and stores the provider payment ID and any
returned payment secret server-side.

The following environment variables are required when enabling AllPays:

- `ALLPAYS_ENABLED`
- `ALLPAYS_API_BASE_URL`
- `ALLPAYS_MERCHANT_WALLET`
- `ALLPAYS_SETTLEMENT_ASSET`
- `ALLPAYS_DEFAULT_CURRENCY`

The AllPays webhook route is `GET /api/webhooks/allpays` and verifies `X-AllPays-Signature`
against the signed callback query string before updating a local order as paid. The
implementation uses the per-payment `payment_secret` returned by AllPays for that specific
payment and does not rely on any global API key or global webhook secret.
