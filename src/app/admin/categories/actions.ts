"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { getAdminUser } from "@/lib/admin-auth";

async function assertAdmin() {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");
}

const categoryInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Lowercase letters, numbers, and hyphens only"),
  displayOrder: z.coerce.number().int(),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;

export async function createCategory(rawInput: CategoryInput) {
  await assertAdmin();
  const input = categoryInputSchema.parse(rawInput);
  await db.insert(categories).values(input);
  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function updateCategory(id: string, rawInput: CategoryInput) {
  await assertAdmin();
  const input = categoryInputSchema.parse(rawInput);
  await db.update(categories).set(input).where(eq(categories.id, id));
  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function deleteCategory(id: string) {
  await assertAdmin();
  // Products referencing this category keep their row (products.categoryId
  // has no onDelete cascade — see db/schema.ts) but their categoryId becomes
  // orphaned-but-valid-FK-wise only if the DB enforces it; Postgres will
  // actually reject this delete with a foreign key violation while any
  // product still references it, which is the right behavior for a CMS with
  // no "what happens to my products" confirmation step — surfaced to the
  // admin as a plain error rather than silently orphaning products.
  await db.delete(categories).where(eq(categories.id, id));
  revalidatePath("/admin/categories");
}

export async function getCategoryById(id: string) {
  await assertAdmin();
  const [category] = await db.select().from(categories).where(eq(categories.id, id));
  return category ?? null;
}
