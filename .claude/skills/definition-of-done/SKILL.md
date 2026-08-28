---
name: definition-of-done
description: GLOBAL — use before considering any feature, fix, or code change finished. The completion checklist (typecheck, lint, tests, changelog, docs drift). Consult at the END of a task, not the start.
---

# Definition of done

On a 5-day full build with no MVP cutting, the only thing worse than shipping late is
shipping broken. Nothing is "done" until this checklist passes.

## Before saying a task is complete

1. `npx tsc --noEmit` — clean.
2. `npm run lint` — clean.
3. `npm run test` — passing (add/update tests for the change if it touches logic worth
   covering — see `testing-conventions`).
4. If the change is UI-visible, actually look at it running (`npm run dev`) — type/lint/
   test passing does not mean it looks or works right. State plainly if you couldn't
   visually verify something (e.g. no way to run a browser) rather than implying it was
   checked.
5. Update `CHANGELOG.md` under `[Unreleased]` (Keep a Changelog format) — once per
   feature, not per commit.
6. If the change altered scope, architecture, schema, or a locked decision — update the
   relevant `docs/*.md` file(s) so they don't silently drift from what the code actually
   does. Stale docs are worse than no docs on a project this docs-driven.
7. If a new reusable pattern was introduced (a new component convention, a new Server
   Action pattern, a new admin form pattern), check whether `COMPONENTS.md` or another
   doc should capture it so the next feature doesn't reinvent it differently.

Don't skip steps to save time under the deadline — a broken build discovered on day 4
costs far more than the two minutes this checklist takes on day 1.
