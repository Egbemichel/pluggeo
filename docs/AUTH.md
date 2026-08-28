# Auth

Clerk, Google sign-in only. No email/password, no other OAuth providers, no magic link.

## Model
- Single role: **admin**. There is no customer account system — the public storefront is
  fully unauthenticated (guest browsing, guest checkout).
- `/admin/**` routes are gated by Clerk middleware; everything else is public.
- Don't build a roles/permissions table or invite flow — allowlist the admin's Google
  account (via Clerk dashboard or an env-configured allowed-email check), since there is
  and will only ever be one admin in v1.

## Implementation notes
- Use Clerk's Next.js middleware to protect the `/admin` route group.
- Restrict sign-in to a specific Google account/email, not open sign-up — anyone
  authenticating with Google should not automatically get admin access.
