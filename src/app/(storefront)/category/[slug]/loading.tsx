import { Skeleton } from "@/components/ui/skeleton";
import { ProductGridSkeleton } from "@/components/ui/product-card-skeleton";

// Next's Suspense fallback for this route segment while the async
// CategoryPage Server Component resolves `params`. Mirrors
// CategoryPageContent's actual shape (header, main grid, "More from us"
// header + grid) rather than a generic spinner, per the user: product cards
// use a skeleton, not the spinner, wherever they're loading.

export default function CategoryLoading() {
  return (
    <div className="flex flex-1 flex-col gap-(--space-9) py-(--space-9)">
      <div className="flex flex-col gap-(--space-2)">
        <Skeleton className="h-10 w-48 md:h-12 md:w-64" />
        <Skeleton className="h-5 w-40" />
      </div>

      <ProductGridSkeleton count={8} columns={4} className="hidden md:grid" />
      <ProductGridSkeleton count={8} columns={2} className="md:hidden" />

      <div className="flex flex-col gap-(--space-2)">
        <Skeleton className="h-10 w-40 md:h-12 md:w-56" />
        <Skeleton className="h-5 w-40" />
      </div>

      <ProductGridSkeleton count={4} columns={4} className="hidden md:grid" />
      <ProductGridSkeleton count={4} columns={2} className="md:hidden" />
    </div>
  );
}
