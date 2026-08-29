// Admin form auto-slug generation (product/category name -> URL slug) — matches
// the `^[a-z0-9]+(-[a-z0-9]+)*$` shape both server schemas already require.
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
