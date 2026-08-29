import { CategoryForm, EMPTY_CATEGORY_FORM_VALUES } from "@/components/admin/category-form";

export default function NewCategoryPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-xl">New category</h1>
      <CategoryForm initialValues={EMPTY_CATEGORY_FORM_VALUES} />
    </div>
  );
}
