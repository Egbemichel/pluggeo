import { cn } from "@/lib/utils";

// Built from the real Figma node (557:4670, "Indicator") — a row of dots showing
// how many images a product has and which one is active. 21px dots, ~7px gap
// (kept literal — doesn't land on a space token).

export type IndicatorProps = {
  count: number;
  activeIndex?: number;
  className?: string;
};

export function Indicator({ count, activeIndex = 0, className }: IndicatorProps) {
  if (count <= 1) return null;

  return (
    <div className={cn("flex items-center gap-1.75", className)}>
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={cn(
            "size-5.25 rounded-full",
            i === activeIndex ? "bg-black" : "bg-gray"
          )}
        />
      ))}
    </div>
  );
}
