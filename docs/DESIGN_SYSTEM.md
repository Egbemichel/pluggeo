# Design System

Captured 2026-08-24 from screenshots of the Figma **Variables** panel (6 collections:
blur, border, color, font, radius, space) and two **Styles** (a text-style list, and one
effect style). Per the user's rule: every Figma *variable* is part of the design system;
Figma *styles* are only included where confirmed. Implemented in
[globals.css](../src/app/globals.css).

Correction from the earlier placeholder version of this doc: there is **no gold/accent
color** in the actual palette. It's navy, black, white, and gray only — the earlier
"gold/diamond accents" line was my assumption before real tokens existed. Don't design
against gold.

## Color

### Primitives (`color/primitive`, 7)

| Token | Value |
|---|---|
| `black` | `#000000` |
| `white` | `#FFFFFF` |
| `navy` | `#141B34` |
| `gray` | `#727272` |
| `black-20` | `#000000` @ 20% opacity |
| `black-40` | `#000000` @ 40% opacity |
| `black-82` | `#000000` @ 82% opacity |

### Semantic (`color/semantic`, 8)

| Token | Value |
|---|---|
| `brand-primary` | `navy` |
| `text-primary` | `black` |
| `text-secondary` | `gray` |
| `text-inverse` | `white` |
| `surface-primary` | `white` |
| `surface-dark` | `navy` |
| `border-default` | `gray` |
| `border-inverse` | `white` |

Reading `surface-primary` (white) and `surface-dark` (navy) as two distinct semantic
roles rather than light/dark modes of one token (the Figma file only has a single mode
per collection) — this reads as a navy page background with white elevated
surfaces (cards, product tiles), which fits a dark luxury site with light product
photography callouts. Confirm against the real frames once Figma MCP/screenshots of
actual screens are available.

Implemented as CSS custom properties named exactly like the Figma tokens (`--navy`,
`--brand-primary`, `--surface-dark`, etc.), then re-exposed under Tailwind's `--color-*`
theme namespace so utilities like `bg-surface-dark`, `text-text-primary`,
`border-border-default` are available directly — deliberately keeping the doubled-up
names (`text-text-primary`) rather than inventing shorter aliases, so class names trace
1:1 back to Figma.

## Typography

### Families (`font/family`, 2)

- `heading` → **Quinn** — not a Google Font as far as I can tell. Site currently falls
  back to a bold system sans until real Quinn font files (woff2) are supplied — flag
  this for the user, it needs actual font files, not just a name.
- `body` → **Inter** — available via `next/font/google`, wired up in `layout.tsx`.

### Weights (`font/weight`, 5)

300 / 400 / 500 / 600 / 700 (light/regular/medium/semibold/bold) — these match
Tailwind's default `font-light`…`font-bold` utility values exactly, so no custom theme
work was needed here.

### Sizes (`font/size`, 11 roles) + line-height

The Variables panel showed size values as "0" for every row (almost certainly a
screenshot/UI rendering artifact, not real data) so the actual pixel sizes below come
from the Text Styles list instead:

| Role | Size |
|---|---|
| `display` | 96px (6rem) |
| `h1` | 64px (4rem) |
| `h2` | 48px (3rem) |
| `h3` | 30px (1.875rem) |
| `h4` | 28px (1.75rem) |
| `h5` | 20px (1.25rem) |
| `h6` | 16px (1rem) |
| `body-lg` | 32px (2rem) |
| `body-md` | 16px (1rem) |
| `body-sm` | 14px (0.875rem) |
| `caption` | 10px (0.625rem) |

**Line-heights (updated 2026-08-24, measured — not guessed):** pulled real text-node
data from the Product Card component (node 557:3742) via the Figma REST API. Every
Quinn (heading font) text node measured a consistent **1.4×** line-height ratio
regardless of size; every Inter (body font) text node measured a consistent **~1.21×**
ratio regardless of size or weight — both are font-intrinsic constants (Figma's "Auto"
line-height reading each font's own metrics), not per-role design choices. Applied
uniformly: all heading-role sizes (`display`…`h6`) use 1.4, all body-role sizes
(`body-lg`, `body-md`, `body-sm`, `caption`) use 1.21. This supersedes the earlier
tight/snug/normal/relaxed per-role guess documented in the first version of this file —
that guess turned out to be checking the right instinct (the raw per-style numbers in
the original Text Styles screenshot did look like a stale-panel artifact) but the wrong
fix; the real ratios are now confirmed from live component data instead.

`label` (10px in the Text Styles list) is a style, not backed by any `font/size`
variable — per your own rule, that means it's not automatically part of the design
system. Not implemented yet; confirm whether it's a real distinct role or a duplicate of
`caption` before I add it.

### Additional type roles (discovered from real components, not the Variables panel)

Product Card (557:3742) uses three sizes that don't match any `font/size` role above.
Promoted to tokens since they're plausibly reused (a price and a "Sale"-style label are
generic UI needs), not left as magic numbers — flagged as confirmed on this one
component only so far:

| Token | Size | Family / weight | Line-height |
|---|---|---|---|
| `text-eyebrow` | 24px (1.5rem) | Inter Light (300) | 1.21 |
| `text-card-title` | 20px (1.25rem) | Inter Regular (400) | 1.21 |
| `text-price` | 22px (1.375rem) | Inter Medium (500) | 1.21 |

Also on that component: the category label ("Bracelets") renders at `body-lg`'s *size*
(32px) but in Quinn Bold at a 1.4 line-height, not Inter/1.21 — i.e. a body-scale size
combined with the heading font. That combination doesn't fit either named role cleanly,
so the component spells out `text-[2rem] leading-[1.4]` explicitly rather than
misusing `body-lg` (which correctly assumes Inter/1.21 for its normal use).

### Line-height ratios (`font/lineHeight`, 4 — largely superseded)

`tight` 1.1 · `snug` 1.25 · `normal` 1.4 · `relaxed` 1.5 were the original Figma
variables. `normal` (1.4) turned out to match Quinn's real measured ratio, kept in use;
the other three aren't currently used anywhere now that real per-family ratios are
confirmed (1.4 / 1.21) — kept defined in `globals.css` in case a specific role is later
shown to deviate from its family's default.

## Spacing (`space`, 14 steps)

4, 6, 8, 10, 14, 16, 20, 24, 28, 32, 48, 64, 80, 96 (px), named `1`–`14` in Figma.

Implemented as plain CSS custom properties `--space-1`…`--space-14` (not under
Tailwind's `--spacing-*` theme namespace) — Tailwind's own numeric spacing scale
already owns the numbers 1–96 with different (multiplier-based) values, so reusing
those exact numbers under `--spacing-*` would silently override core Tailwind utilities
like `p-4`/`gap-6` with mismatched values. Use these via arbitrary value syntax instead,
e.g. `gap-[var(--space-6)]`, `p-[var(--space-10)]`.

## Radius (`radius`, 3)

- `sm` — 8px (0.5rem)
- `md` — 16px (1rem)
- `full` — 9999px

`sm`/`md` are wired directly into Tailwind's `--radius-sm`/`--radius-md` theme keys, so
`rounded-sm`/`rounded-md` now mean Plug Geo's values everywhere, including in the
existing shadcn Button component which already references `var(--radius-md)`. `full`
needs no custom token — Tailwind's built-in `rounded-full` already means "fully
rounded." Tiers beyond what Figma defines (`lg`/`xl`/`2xl`/`3xl`/`4xl`, kept for
shadcn components that expect them) are extrapolated from `md` as a placeholder scale,
not sourced from Figma — revisit if a real component needs one of those sizes.

## Border width (`border/width`, 3)

`thin` 1px · `default` 2px · `thick` 3px — plain CSS custom properties
(`--border-width-thin` etc.), used via arbitrary value syntax
(`border-[length:var(--border-width-thick)]`), same reasoning as spacing.

## Blur (`blur`, 2)

`sm` 2px · `md` 8px — wired into Tailwind's `--blur-sm`/`--blur-md` theme keys,
overriding Tailwind's (much larger) defaults, so `blur-sm`/`blur-md` now mean Plug
Geo's values.

## Effects — Styles (not variables, confirm before treating as canonical)

- **`drop-shadow`** (effect style): offset X 8 / Y 6, blur 4, spread 0, color `#000000`
  @ 25% opacity. This is the only effect style seen so far and reads as a clear
  foundational token (card/product elevation shadow), so it's implemented as
  `--shadow-drop` — flag it for confirmation along with `label` since it's a style, not
  a variable.

## Still open

- Confirm the heading/body-sm/caption line-height mapping above against real Figma
  values (flagged, not blocking)
- Quinn font files needed for the heading typeface
- Confirm `label` text style and `drop-shadow` effect style are canonical design-system
  entries (per your rule that styles need confirmation, unlike variables)
- Real screens/frames (Home, Grillz, Category, Shop, PDP) still need pulling — this doc
  only covers tokens, not layout. See [FIGMA_MAPPING.md](FIGMA_MAPPING.md).
