import { ProductCard, type ProductCardProps } from "@/components/product-card";
import { cn } from "@/lib/utils";

// Shop's gallery-mode listing — same source frame as the imageGallery carousel
// (596:600, the repeated "Frame 349/351/..." rows below it), just ProductCard in
// "row" layout stacked vertically.

export type ProductListProps = {
  products: (Omit<ProductCardProps, "layout"> & { key: string })[];
  className?: string;
};

export function ProductList({ products, className }: ProductListProps) {
  return (
    <div className={cn("flex flex-col gap-(--space-6)", className)}>
      {products.map(({ key, ...product }) => (
        <ProductCard key={key} layout="row" {...product} />
      ))}
    </div>
  );
}
