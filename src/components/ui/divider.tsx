import { cn, toCssLength } from "@/lib/utils";

// No Figma reference — self-designed per the user's spec: gray (--gray token, never
// hardcoded), 1px weight (--border-width-thin token), variable length so it can act
// as a short separator or a long section rule.
//
// 2026-08-28: a *vertical* divider with `length` omitted used to default to
// `height: 100%` — every real usage up to that point always passed an explicit
// `length`, so this never got exercised until the shop page tried to span a
// sidebar row with variable (content-driven, effectively auto) height, and it
// rendered at 0 height. Percentage heights don't reliably resolve against a
// flex container whose own height is auto/content-driven — confirmed via a
// real bounding-rect check, not just spec-reading. Fixed by relying on
// `align-self: stretch` instead when vertical + no length: that works
// correctly regardless of whether the parent's height is indeterminate, since
// it's driven by the sibling's rendered size rather than a percentage
// calculation. Horizontal's `width: 100%` default is untouched — percentage
// widths against a block/flex container don't have this problem.

export type DividerProps = {
  orientation?: "horizontal" | "vertical";
  /** Number = px, or any CSS length. Omit for 100% of the cross axis
   * (horizontal) or align-self:stretch to match a flex/grid sibling
   * (vertical) — see the file comment for why they differ. */
  length?: number | string;
  className?: string;
};

export function Divider({
  orientation = "horizontal",
  length,
  className,
}: DividerProps) {
  const resolvedLength = toCssLength(length);
  const isHorizontal = orientation === "horizontal";

  return (
    <div
      role="separator"
      aria-orientation={orientation}
      style={{
        width: isHorizontal ? (resolvedLength ?? "100%") : "var(--border-width-thin)",
        height: isHorizontal ? "var(--border-width-thin)" : resolvedLength,
      }}
      className={cn(
        "shrink-0 bg-gray",
        !isHorizontal && length === undefined && "self-stretch",
        className
      )}
    />
  );
}
