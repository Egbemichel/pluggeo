import { Suspense } from "react";
import Link from "next/link";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CategoryRowActions } from "@/components/admin/category-row-actions";
import { CreatedToast } from "@/components/admin/created-toast";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const rows = await db.select().from(categories).orderBy(asc(categories.displayOrder));

  return (
    <div className="flex flex-col gap-4">
      <Suspense fallback={null}>
        <CreatedToast param="created" message="Category created." />
        <CreatedToast param="updated" message="Category saved." />
      </Suspense>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl">Categories</h1>
          <p className="text-sm text-muted-foreground">{rows.length} total</p>
        </div>
        <Link
          href="/pluggeo/categories/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          New category
        </Link>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Display order</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                  No categories yet — create the first one.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="text-muted-foreground">{row.slug}</TableCell>
                  <TableCell className="text-muted-foreground">{row.displayOrder}</TableCell>
                  <TableCell>
                    <CategoryRowActions id={row.id} name={row.name} />
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
