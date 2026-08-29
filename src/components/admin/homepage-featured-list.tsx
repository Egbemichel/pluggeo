"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { setFeatured } from "@/app/pluggeo/products/actions";

export type HomepageProductRow = {
  id: string;
  name: string;
  featured: boolean;
  featuredOrder: number | null;
};

export function HomepageFeaturedList({ products }: { products: HomepageProductRow[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [orders, setOrders] = useState<Record<string, string>>(
    Object.fromEntries(products.map((p) => [p.id, p.featuredOrder != null ? String(p.featuredOrder) : ""]))
  );

  const toggleFeatured = (product: HomepageProductRow, checked: boolean) => {
    const order = checked
      ? Number(orders[product.id]) || products.filter((p) => p.featured).length
      : null;
    startTransition(async () => {
      await setFeatured(product.id, checked, order);
      router.refresh();
    });
  };

  const commitOrder = (product: HomepageProductRow) => {
    if (!product.featured) return;
    const order = Number(orders[product.id]) || 0;
    startTransition(async () => {
      await setFeatured(product.id, true, order);
      router.refresh();
    });
  };

  if (products.length === 0) {
    return (
      <p className="rounded-lg border border-border p-10 text-center text-muted-foreground">
        No published products yet — publish a product first, then feature it here.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="p-2 font-medium">Name</th>
            <th className="p-2 font-medium">Featured on homepage</th>
            <th className="p-2 font-medium">Order</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className="border-b border-border last:border-0">
              <td className="p-2">{product.name}</td>
              <td className="p-2">
                <Checkbox
                  checked={product.featured}
                  disabled={isPending}
                  onCheckedChange={(checked) => toggleFeatured(product, checked === true)}
                />
              </td>
              <td className="p-2">
                <Input
                  type="number"
                  step="1"
                  className="w-20"
                  disabled={!product.featured || isPending}
                  value={orders[product.id] ?? ""}
                  onChange={(e) => setOrders((prev) => ({ ...prev, [product.id]: e.target.value }))}
                  onBlur={() => commitOrder(product)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
