import { ProductCard, type ProductCardProps } from "@/components/product-card";
import { cn } from "@/lib/utils";

// Built from the real Figma node (594:574, "productGrid") — a 2-column grid of
// ProductCard, gap 20px (--space-7) horizontal / 38px (literal, no matching token)
// vertical. `columns` is a prop (not a fixed 2) since the Bestsellers section on
// Home uses the same grid at 4 columns — same component, not a duplicate. Uses an
// inline `gridTemplateColumns` rather than a dynamic `grid-cols-N` class, since
// Tailwind can't generate CSS for a class built at runtime.
//
// 2026-08-27 QA pass: horizontal gap tightened to 10px (--space-4) below md — at
// the confirmed mobile 2-column layout, the full 20px gap plus the page's own
// horizontal padding left each card too narrow for its info block to read cleanly
// (per a Figma screenshot comparison). Desktop gap unchanged.

export type ProductGridProps = {
  products: (Omit<ProductCardProps, "layout"> & { key: string })[];
  columns?: number;
  className?: string;
};

export function ProductGrid({ products, columns = 2, className }: ProductGridProps) {
  return (
    <div
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      className={cn("grid gap-x-(--space-4) gap-y-9.5 md:gap-x-(--space-7)", className)}
    >
      {products.map(({ key, ...product }) => (
        <ProductCard key={key} layout="card" className="w-full" {...product} />
      ))}
    </div>
  );
}
