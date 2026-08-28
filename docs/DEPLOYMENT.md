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
