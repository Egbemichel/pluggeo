import { getPublishedProductsForHomepage } from "@/app/admin/products/actions";
import { HomepageFeaturedList } from "@/components/admin/homepage-featured-list";

export const dynamic = "force-dynamic";

export default async function AdminHomepagePage() {
  const products = await getPublishedProductsForHomepage();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-heading text-xl">Homepage</h1>
        <p className="text-sm text-muted-foreground">
          Pick which published products show in the homepage&apos;s &quot;Bestsellers&quot; section, and
          in what order.
        </p>
      </div>

      <HomepageFeaturedList
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          featured: p.featured,
          featuredOrder: p.featuredOrder,
        }))}
      />
    </div>
  );
}
