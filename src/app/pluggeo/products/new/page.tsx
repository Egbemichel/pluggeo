import { Suspense } from "react";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { ProductForm, EMPTY_PRODUCT_FORM_VALUES } from "@/components/admin/product-form";
import { CreatedToast } from "@/components/admin/created-toast";

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const { created } = await searchParams;

  const categoryRows = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .orderBy(asc(categories.displayOrder));

  return (
    <div className="flex flex-col gap-6">
      <Suspense fallback={null}>
        <CreatedToast param="created" message="Product created." />
      </Suspense>
      <h1 className="font-heading text-xl">New product</h1>
      {/* `key` forces a fresh `ProductForm` instance after a create redirect
          lands back here — this is the *same route* as before (just with
          `?created=1` appended), so without a changing key React would
          reconcile the existing form in place and keep every field the
          admin just typed, instead of actually clearing it. */}
      <ProductForm
        key={created ?? "empty"}
        categories={categoryRows}
        initialValues={EMPTY_PRODUCT_FORM_VALUES}
      />
    </div>
  );
}
