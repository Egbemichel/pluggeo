import { asc } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { ProductForm, EMPTY_PRODUCT_FORM_VALUES } from "@/components/admin/product-form";

export default async function NewProductPage() {
  const categoryRows = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .orderBy(asc(categories.displayOrder));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-xl">New product</h1>
      <ProductForm categories={categoryRows} initialValues={EMPTY_PRODUCT_FORM_VALUES} />
    </div>
  );
}
