import { cn } from "@/lib/utils";

// No Figma reference — standard shimmer placeholder using the black-40 primitive
// over the page's dark surface. See docs/COMPONENTS.md.

export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "animate-pulse rounded-md bg-black-40 motion-reduce:animate-none",
        className
      )}
      {...props}
    />
  );
}
