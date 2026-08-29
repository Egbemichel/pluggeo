import { notFound } from "next/navigation";
import { getCategoryById } from "@/app/pluggeo/categories/actions";
import { CategoryForm, type CategoryFormInitialValues } from "@/components/admin/category-form";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const category = await getCategoryById(id);
  if (!category) notFound();

  const initialValues: CategoryFormInitialValues = {
    id: category.id,
    name: category.name,
    slug: category.slug,
    displayOrder: String(category.displayOrder),
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-xl">Edit category</h1>
      <CategoryForm initialValues={initialValues} />
    </div>
  );
}
