// Shared distance-based scale for "coverflow" style pickers — PaginationDial
// (557:4754) and CategoryDial (557:4412, "shopCategoryDial") both size/blur their
// items by distance from the active one, with the same ~0.15 corner-radius-to-size
// ratio. Extracted here so both components share the math instead of duplicating it.

export const COVERFLOW_SIZE_BY_DISTANCE = [106, 97, 89, 73]; // px, measured
export const COVERFLOW_MIN_SIZE =
  COVERFLOW_SIZE_BY_DISTANCE[COVERFLOW_SIZE_BY_DISTANCE.length - 1];

export function coverflowSizeForDistance(distance: number) {
  return COVERFLOW_SIZE_BY_DISTANCE[distance] ?? COVERFLOW_MIN_SIZE;
}

export function coverflowRadiusForDistance(distance: number) {
  return coverflowSizeForDistance(distance) * 0.15;
}

// The Figma source blurred every item before the active one and left everything
// from active onward sharp — read as inconsistent/experimental rather than
// deliberate (see PaginationDial), so this applies a symmetric distance-based blur
// instead.
export function coverflowBlurForDistance(distance: number) {
  return distance === 0 ? undefined : `blur(${Math.min(distance, 3)}px)`;
}
