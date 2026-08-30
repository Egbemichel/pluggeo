// Shared shape for a single product media item — image or video — used by
// every storefront surface that renders a product's gallery (cards, Shop's
// spotlight coverflow, the PDP gallery, the fullscreen lightbox). Kept in
// its own dependency-free file (no `db`/server imports) so client
// components can import the type directly, the same way they already
// inline `{ src, alt }` shapes today.
export type MediaItem = { type: "image" | "video"; src: string; alt: string };
