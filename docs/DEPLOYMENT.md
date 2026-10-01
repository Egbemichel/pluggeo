# Deployment

## Environments
- **Local** — `next dev`
- **Staging** — Cloudflare, for pre-production review
- **Production** — Cloudflare Worker at `pluggeoandco.shop`

## Target
Cloudflare Workers via OpenNext (`@opennextjs/cloudflare`). Neon (Postgres) is reached
over its serverless driver, which is Workers-compatible.

## Notes
- Secrets (Clerk keys, Neon connection string, Resend API key) go
  through Cloudflare environment variables/secrets, never committed.

## Manual order payments

Checkout creates pending orders and does not charge customers. The GitHub deployment
workflow applies migration `0005` before deploying. Configure these under the deployed
Worker's Settings → Variables and Secrets (runtime bindings, not GitHub Actions build
environment values):

- `RESEND_API_KEY` — Resend API key
- `RESEND_FROM_EMAIL` — sender address on a verified Resend domain
- `ORDER_NOTIFICATION_EMAIL` — owner's order-notification inbox

The proof-upload route also needs the existing Cloudinary values, including
`CLOUDINARY_API_SECRET`. Set the accepted token/asset and customer instructions for each
crypto wallet in `/pluggeo/payments` before customers send funds. The seeded Polygon
wallet address does not identify an accepted token by itself.

Card2Crypto and AllPays callback integrations remain in the codebase but are not selected
by the storefront's manual order flow.
