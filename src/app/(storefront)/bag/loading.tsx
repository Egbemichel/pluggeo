import { Spinner } from "@/components/ui/spinner";

// `/bag`'s page.tsx is a Client Component with no server async boundary (no
// `await` to suspend on), so this can't get the same minDelay treatment as
// product/[slug] or category/[slug] — there's nothing to wrap it with. Still
// worth having: Next shows a segment's loading.tsx during the route's own
// code-split/RSC-payload fetch on any client-side navigation, async page or
// not, so this gives real loading feedback instead of nothing while
// navigating here — same shape as ProductLoading (Spinner, not a skeleton,
// since this isn't a grid of product cards).

export default function BagLoading() {
  return (
    <div className="flex flex-1 items-center justify-center py-(--space-12)">
      <Spinner size={64} />
    </div>
  );
}
