import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Loading placeholder shaped to match ProductCard's "card" layout exactly
// (same border/radius/shadow/padding), per the user: product cards use a
// skeleton, not the spinner, wherever they're loading. `ProductGridSkeleton`
// below mirrors ProductGrid's own grid classes so swapping one for the other
// during a real fetch doesn't shift layout.

export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-sm border border-border-default bg-surface-primary shadow-(--shadow-drop) md:rounded-md",
        className
      )}
    >
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="mt-10.25 flex flex-col gap-(--space-2) px-(--space-4) pb-3.75 md:px-3.75">
        <Skeleton className="h-5 w-2/5 md:h-8" />
        <Skeleton className="h-4 w-4/5 md:h-6" />
        <Skeleton className="h-4 w-1/3 md:h-6" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({
  count = 8,
  columns = 2,
  className,
}: {
  count?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      className={cn("grid gap-x-(--space-4) gap-y-9.5 md:gap-x-(--space-7)", className)}
    >
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
