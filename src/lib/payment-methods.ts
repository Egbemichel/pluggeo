import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { paymentMethods } from "@/db/schema";

export async function getEnabledPaymentMethods() {
  return db
    .select({
      id: paymentMethods.id,
      name: paymentMethods.name,
      slug: paymentMethods.slug,
      description: paymentMethods.description,
      instructions: paymentMethods.instructions,
      isCrypto: paymentMethods.isCrypto,
      requireProof: paymentMethods.requireProof,
      discountPercent: paymentMethods.discountPercent,
      customerFields: paymentMethods.customerFields,
      wallets: paymentMethods.wallets,
    })
    .from(paymentMethods)
    .where(eq(paymentMethods.enabled, true))
    .orderBy(asc(paymentMethods.sortOrder), asc(paymentMethods.name));
}
