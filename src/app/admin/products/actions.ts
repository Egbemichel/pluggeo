"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, asc, desc } from "drizzle-orm";
import { db } from "@/db";
import { products, productMedia, productVariants } from "@/db/schema";
import { getAdminUser } from "@/lib/admin-auth";

// All input here comes from a browser form, not a trusted internal caller —
// validated with zod regardless of the single-trusted-admin scope, per
// docs/API.md. Every action re-checks `getAdminUser()` itself rather than
// relying solely on admin/layout.tsx's route-level guard, since Server
// Actions can in principle be invoked directly (belt-and-suspenders, not
// duplicated trust).

async function assertAdmin() {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");
}

const mediaItemSchema = z.object({
  type: z.enum(["image", "video"]),
  url: z.string().url(),
  altText: z.string().optional(),
});

const variantSchema = z.object({
  label: z.string().min(1),
  attributes: z.record(z.string(), z.string()),
  priceOverride: z.coerce.number().positive().optional(),
  available: z.boolean(),
});

const productInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Lowercase letters, numbers, and hyphens only"),
  description: z.string().optional(),
  price: z.coerce.number().positive("Price must be positive"),
  compareAtPrice: z.coerce.number().positive().optional(),
  categoryId: z.string().uuid().optional(),
  status: z.enum(["draft", "published"]),
  featured: z.boolean(),
  media: z.array(mediaItemSchema),
  variants: z.array(variantSchema),
});

export type ProductInput = z.infer<typeof productInputSchema>;

async function writeMediaAndVariants(productId: string, input: ProductInput) {
  // Replace-in-place: simplest correct approach for a single-admin CMS with
  // no concurrent editors — delete the product's existing media/variant
  // rows and re-insert from the form's current state, rather than trying to
  // diff and patch individual rows.
  await db.delete(productMedia).where(eq(productMedia.productId, productId));
  await db.delete(productVariants).where(eq(productVariants.productId, productId));

  if (input.media.length > 0) {
    await db.insert(productMedia).values(
      input.media.map((item, index) => ({
        productId,
        type: item.type,
        url: item.url,
        altText: item.altText,
        sortOrder: index,
      }))
    );
  }

  if (input.variants.length > 0) {
    await db.insert(productVariants).values(
      input.variants.map((variant) => ({
        productId,
        label: variant.label,
        attributes: variant.attributes,
        priceOverride: variant.priceOverride != null ? String(variant.priceOverride) : null,
        available: variant.available,
      }))
    );
  }
}

export async function createProduct(rawInput: ProductInput) {
  await assertAdmin();
  const input = productInputSchema.parse(rawInput);

  const [product] = await db
    .insert(products)
    .values({
      name: input.name,
      slug: input.slug,
      description: input.description,
      price: String(input.price),
      compareAtPrice: input.compareAtPrice != null ? String(input.compareAtPrice) : null,
      categoryId: input.categoryId,
      status: input.status,
      featured: input.featured,
    })
    .returning({ id: products.id });

  await writeMediaAndVariants(product.id, input);

  revalidatePath("/admin/products");
  redirect(`/admin/products/${product.id}/edit`);
}

export async function updateProduct(id: string, rawInput: ProductInput) {
  await assertAdmin();
  const input = productInputSchema.parse(rawInput);

  await db
    .update(products)
    .set({
      name: input.name,
      slug: input.slug,
      description: input.description,
      price: String(input.price),
      compareAtPrice: input.compareAtPrice != null ? String(input.compareAtPrice) : null,
      categoryId: input.categoryId,
      status: input.status,
      featured: input.featured,
      updatedAt: new Date(),
    })
    .where(eq(products.id, id));

  await writeMediaAndVariants(id, input);

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}/edit`);
}

export async function deleteProduct(id: string) {
  await assertAdmin();
  // product_media/product_variants cascade on products delete (see
  // db/schema.ts) — no separate cleanup needed.
  await db.delete(products).where(eq(products.id, id));
  revalidatePath("/admin/products");
}

export async function setProductStatus(id: string, status: "draft" | "published") {
  await assertAdmin();
  await db.update(products).set({ status, updatedAt: new Date() }).where(eq(products.id, id));
  revalidatePath("/admin/products");
}

// Homepage curation ("which products/collections are featured and where" —
// docs/ADMIN.md): `featured`/`featuredOrder` already existed on the schema
// for exactly this, just had no admin UI writing to them yet.
export async function setFeatured(id: string, featured: boolean, featuredOrder: number | null) {
  await assertAdmin();
  await db
    .update(products)
    .set({ featured, featuredOrder, updatedAt: new Date() })
    .where(eq(products.id, id));
  revalidatePath("/admin/homepage");
  revalidatePath("/");
}

export async function getPublishedProductsForHomepage() {
  await assertAdmin();
  return db.query.products.findMany({
    where: eq(products.status, "published"),
    orderBy: [asc(products.featuredOrder), desc(products.createdAt)],
  });
}

export async function getProductWithRelations(id: string) {
  await assertAdmin();
  const product = await db.query.products.findFirst({ where: eq(products.id, id) });
  if (!product) return null;

  const [media, variants] = await Promise.all([
    db.query.productMedia.findMany({
      where: eq(productMedia.productId, id),
      orderBy: asc(productMedia.sortOrder),
    }),
    db.query.productVariants.findMany({ where: eq(productVariants.productId, id) }),
  ]);

  return { product, media, variants };
}
