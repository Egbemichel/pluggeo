import { notFound } from "next/navigation";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { getProductWithRelations } from "@/app/pluggeo/products/actions";
import { ProductForm, type ProductFormInitialValues } from "@/components/admin/product-form";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [result, categoryRows] = await Promise.all([
    getProductWithRelations(id),
    db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(asc(categories.displayOrder)),
  ]);

  if (!result) notFound();

  const { product, media, variants } = result;

  const initialValues: ProductFormInitialValues = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description ?? "",
    price: product.price,
    compareAtPrice: product.compareAtPrice ?? "",
    categoryId: product.categoryId ?? "",
    status: product.status,
    featured: product.featured,
    media: media.map((m) => ({ type: m.type, url: m.url, altText: m.altText ?? undefined })),
    variants: variants.map((v) => ({
      label: v.label,
      priceOverride: v.priceOverride ?? "",
      available: v.available,
      attributes: Object.entries(v.attributes).map(([key, values]) => ({ key, values })),
    })),
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-xl">Edit product</h1>
      <ProductForm categories={categoryRows} initialValues={initialValues} />
    </div>
  );
}
