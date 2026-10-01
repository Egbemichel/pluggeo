"use server";

import { revalidatePath } from "next/cache";
import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { paymentMethods } from "@/db/schema";
import { getAdminUser } from "@/lib/admin-auth";
import { paymentMethodInputSchema } from "@/lib/payment-method-schema";

async function assertAdmin() {
  if (!(await getAdminUser())) throw new Error("Unauthorized");
}

export async function getAdminPaymentMethods() {
  await assertAdmin();
  return db.select().from(paymentMethods).orderBy(asc(paymentMethods.sortOrder), asc(paymentMethods.name));
}

export async function savePaymentMethod(
  id: string | null,
  rawInput: unknown,
): Promise<{ success: true } | { success: false; error: string }> {
  await assertAdmin();
  const parsed = paymentMethodInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Check the payment method fields." };
  }

  if (id && !/^[0-9a-f-]{36}$/i.test(id)) {
    return { success: false, error: "Invalid payment method." };
  }

  try {
    const input = parsed.data;
    const values = {
      name: input.name,
      slug: input.slug,
      description: input.description,
      instructions: input.instructions,
      enabled: input.enabled,
      isCrypto: input.isCrypto,
      requireProof: input.requireProof,
      discountPercent: input.discountPercent.toFixed(2),
      customerFields: input.customerFields,
      wallets: input.wallets,
      sortOrder: input.sortOrder,
      updatedAt: new Date(),
    };

    if (id) {
      await db.update(paymentMethods).set(values).where(eq(paymentMethods.id, id));
    } else {
      await db.insert(paymentMethods).values(values);
    }

    revalidatePath("/pluggeo/payments");
    revalidatePath("/api/payments/methods");
    return { success: true };
  } catch (error) {
    console.error("Payment method save failed:", error);
    return { success: false, error: "Could not save. Check that the method name and slug are unique." };
  }
}

export async function deletePaymentMethod(
  id: string,
): Promise<{ success: true } | { success: false; error: string }> {
  await assertAdmin();
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return { success: false, error: "Invalid payment method." };
  }

  try {
    await db.delete(paymentMethods).where(eq(paymentMethods.id, id));
    revalidatePath("/pluggeo/payments");
    revalidatePath("/api/payments/methods");
    return { success: true };
  } catch (error) {
    console.error("Payment method delete failed:", error);
    return { success: false, error: "Could not delete this payment method." };
  }
}
