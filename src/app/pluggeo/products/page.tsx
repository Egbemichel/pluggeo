import Link from "next/link";
import Image from "next/image";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { products, productMedia, categories } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProductRowActions } from "@/components/admin/product-row-actions";

export const dynamic = "force-dynamic";

async function getProductRows() {
  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      price: products.price,
      status: products.status,
      featured: products.featured,
      categoryName: categories.name,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .orderBy(desc(products.createdAt));

  const media = await db
    .select({
      productId: productMedia.productId,
      url: productMedia.url,
      type: productMedia.type,
      sortOrder: productMedia.sortOrder,
    })
    .from(productMedia);

  // Keep the lowest sortOrder item per product as its list thumbnail.
  const thumbnailByProduct = new Map<string, { url: string; type: "image" | "video" }>();
  const bestSortOrder = new Map<string, number>();
  for (const item of media) {
    const current = bestSortOrder.get(item.productId);
    if (current === undefined || item.sortOrder < current) {
      bestSortOrder.set(item.productId, item.sortOrder);
      thumbnailByProduct.set(item.productId, { url: item.url, type: item.type });
    }
  }

  return rows.map((row) => ({ ...row, thumbnail: thumbnailByProduct.get(row.id) ?? null }));
}

export default async function AdminProductsPage() {
  const rows = await getProductRows();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl">Products</h1>
          <p className="text-sm text-muted-foreground">{rows.length} total</p>
        </div>
        <Link
          href="/pluggeo/products/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          New product
        </Link>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Media</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  No products yet — create the first one.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="relative size-10 overflow-hidden rounded-md bg-muted">
                      {row.thumbnail && row.thumbnail.type === "image" && (
                        <Image src={row.thumbnail.url} alt="" fill className="object-cover" />
                      )}
                      {row.thumbnail && row.thumbnail.type === "video" && (
                        <video src={row.thumbnail.url} className="size-full object-cover" muted />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.categoryName ?? "—"}
                  </TableCell>
                  <TableCell>${row.price}</TableCell>
                  <TableCell>
                    <Badge variant={row.status === "published" ? "default" : "outline"}>
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.featured ? "Yes" : "—"}
                  </TableCell>
                  <TableCell>
                    <ProductRowActions
                      id={row.id}
                      status={row.status}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
