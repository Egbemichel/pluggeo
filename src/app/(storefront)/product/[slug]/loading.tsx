import { Spinner } from "@/components/ui/spinner";

// Next's Suspense fallback for this route segment while the async
// ProductPage Server Component resolves `params`. The PDP isn't a grid of
// product cards, so per the user this uses the app-wide spinner rather than
// a skeleton (that's reserved for product-card grids specifically — see
// CategoryLoading).

export default function ProductLoading() {
  return (
    <div className="flex flex-1 items-center justify-center py-(--space-12)">
      <Spinner size={64} />
    </div>
  );
}
