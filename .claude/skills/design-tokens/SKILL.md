---
name: design-tokens
description: GLOBAL — use for any code that touches className, CSS, or visual styling. Enforces using Plug Geo's Figma-sourced design tokens (docs/DESIGN_SYSTEM.md) instead of arbitrary hardcoded colors, spacing, radius, or font sizes. Consult before writing or reviewing any UI markup.
---

# Design tokens

Every visual value in this codebase should trace back to a token defined in
`docs/DESIGN_SYSTEM.md` / `src/app/globals.css`. Arbitrary one-off values are a design
system violation, not a shortcut.

## Rules

- **Colors**: use the semantic utilities (`bg-surface-dark`, `text-text-primary`,
  `text-text-secondary`, `border-border-default`, `bg-brand-primary`, etc.) or the
  primitives (`bg-navy`, `text-white`) — never a raw hex or `rgb()` in a `className`.
  There is **no gold/accent color** in this palette (navy/black/white/gray only) —
  don't invent one for "visual interest."
- **Typography**: use the role utilities (`text-display`, `text-h1`…`text-h6`,
  `text-body-lg`, `text-body-md`, `text-body-sm`, `text-caption`) — these already carry
  the correct line-height. Don't hand-pick a Tailwind default size (`text-4xl`, etc.)
  for anything that maps to a named role.
- **Spacing**: Tailwind's own numeric spacing scale (`p-4`, `gap-6`) is fine for
  general layout — it's unrelated to Figma's `space` collection. When a spacing value
  specifically needs to match a Figma `space` step, use the CSS-variable shorthand:
  `gap-(--space-6)`, not a guessed Tailwind number.
- **Radius**: `rounded-sm` / `rounded-md` already are Plug Geo's tokens (8px/16px).
  `rounded-full` is correct for "full." Tiers beyond that (`lg`/`xl`/`2xl`+) are an
  extrapolated placeholder scale, not from Figma — avoid relying on them for anything
  that appears in a real Figma frame.
- **Blur / border-width / shadow**: `blur-sm`/`blur-md` are wired to Figma's values
  already. The confirmed drop-shadow uses `shadow-(--shadow-drop)`. Border width isn't
  used in a component yet — try the `(length:--border-width-thick)` shorthand first,
  fall back to `border-[length:var(--border-width-thick)]` if the linter doesn't accept
  it.
- **Pure CSS-variable arbitrary values use the `(--foo)` shorthand, not `[var(--foo)]`**
  (e.g. `gap-(--space-4)` not `gap-[var(--space-4)]`) — that's Tailwind v4's canonical
  form and what the linter will flag otherwise. Reserve square-bracket arbitrary values
  (`text-[2rem]`, `leading-[1.4]`) for literal one-off values that aren't a CSS variable.

## When a value isn't in the token set

Don't invent one and move on silently. Flag it in your response ("Figma doesn't define
a token for X, I used Y as a placeholder") so it gets confirmed against the real frame
rather than quietly becoming permanent.

## Fonts

Body text uses Inter (`font-sans`), headings use `font-heading` (Quinn, local `.otf`,
Bold weight only) — both wired up in `layout.tsx`. Line-heights are measured, not
guessed: Quinn is 1.4× at any size, Inter is ~1.21× at any size/weight (font-intrinsic
constants, confirmed from real component data — see `docs/DESIGN_SYSTEM.md`). If a
component's text doesn't match a named `text-*` role's size, don't force it into the
nearest one — check whether the font-family matches too (a body-scale size rendered in
Quinn needs its line-height spelled out explicitly, not borrowed from a body-* token
that assumes Inter's ratio).
