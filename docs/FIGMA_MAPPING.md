# Figma → Code Mapping

Figma Dev Mode (which gates the official Dev Mode MCP Server and Code Connect) requires
a paid seat — not available on the free plan this project uses, so those specific tools
stay off the table. In practice this hasn't blocked anything: two other paths cover the
same ground and are both in active use. Design tokens are captured in
[DESIGN_SYSTEM.md](DESIGN_SYSTEM.md); component/screen build status lives in
[PROGRESS.md](PROGRESS.md).

## Workflow — two tools in active use together

### REST API + Personal Access Token — precise numeric/style data

The plain Figma REST API is **not** Dev-Mode-gated — works on any plan. `FIGMA_TOKEN` /
`FIGMA_FILE_KEY` are already set in `.env.local`.

- `GET /v1/files/{file_key}/nodes?ids={node-ids}` — exact geometry, auto-layout
  (direction/gap/padding/alignment), fills, strokes, effects, and text style per node.
- `GET /v1/images/{file_key}?ids={node-ids}&format=svg|png&scale=2` — a rendered
  export of any frame or icon, straight from Figma's renderer — used both for visual
  reference and to export real assets (logos, product photos) directly into `public/`.

To use: share the file key (from the URL: `figma.com/design/{FILE_KEY}/...`) plus the
node ID for a frame (right-click → "Copy link to selection," the URL's `node-id=`
param) — node data gets fetched via `curl` and built against real numbers.

### `claude.ai Figma` MCP connector — visual + structural ground truth

Became available mid-project and is now used alongside the REST pipeline, not instead
of it:

- `get_screenshot` — an actual rendered image of a node. Especially valuable for large
  or ambiguous frames before diving into raw JSON (this is how the "Product horizontal
  gallery" frame turned out to actually contain two separate things bundled together,
  and how the sidebar's sub-pieces became clear at a glance).
- `get_metadata` — an XML structure dump (node names/types/positions) of a frame,
  useful for finding the right child node IDs to drill into.
- `get_design_context` also exists (fuller code-generation context) but hasn't been
  needed yet — the REST pipeline + screenshots have been enough.

**Rule of thumb**: reach for a screenshot first on anything large, nested, or where the
node name alone doesn't make the content obvious. Use the REST API for the numeric
precision (exact px, colors, fonts) once you know what you're looking at.

## Per-component/screen process

1. **Look** — screenshot and/or metadata for anything non-trivial, to know what's
   actually there before parsing raw node data.
2. **Build the piece** — implement using real numbers and design tokens (see the
   `figma-fidelity` and `design-tokens` skills). Check whether an existing component
   already covers the same shape before adding a new one (see `docs/COMPONENTS.md`).
3. **Verify** — build/typecheck/lint clean, visually check when possible (no browser
   tool available in this environment — ask the user to confirm with `npm run dev`).
4. **Record** — update [PROGRESS.md](PROGRESS.md) with the component, its source node
   ID, and any flagged deviations.

## Still open

- Typography scale → role mapping was inferred from the Text Styles list and confirmed
  piecemeal as real components get pulled (see the line-height correction in
  `DESIGN_SYSTEM.md`) — not fully cross-checked against every screen yet.
- `label` text style still unconfirmed as canonical (a Figma *style*, not a *variable*
  — per the user's rule those need explicit confirmation).
