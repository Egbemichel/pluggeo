# Deployment

## Environments
- **Local** — current default, `next dev`, no domain yet
- **Staging** — Cloudflare, for pre-production review
- **Production** — Cloudflare, once a domain is pointed at it (not yet set up)

## Target
Cloudflare Workers via OpenNext (`@opennextjs/cloudflare`). Neon (Postgres) is reached
over its serverless driver, which is Workers-compatible.

## Notes
- No domain connected yet — deployment setup (wrangler.toml, Cloudflare project, env
  bindings for Neon/Clerk secrets) can be scaffolded now, but actual staging/production
  deploys wait until there's somewhere to point them.
- Secrets (Clerk keys, Neon connection string, payment processor keys once decided) go
  through Cloudflare environment variables/secrets, never committed.

## Payment providers

Both Card2Crypto and AllPays are server-side providers. Production setup must include the
relevant secret values in the Cloudflare environment, and the public site URL must match
`NEXT_PUBLIC_SITE_URL` so callback and return URLs resolve correctly.

For AllPays, the webhook URL should be registered to the live domain as:

- `https://<live-domain>/api/webhooks/allpays`

The same route must remain publicly reachable from the deployed runtime, with the webhook
signature verified before any order is marked paid.
