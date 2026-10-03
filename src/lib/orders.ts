import { db } from "@/db";
import { orderItems, orders, paymentMethods } from "@/db/schema";

import {
  createCheckoutQuote,
  type CheckoutItemInput,
} from "@/lib/checkout";
import {
  sendCustomerOrderConfirmation,
  sendOwnerOrderNotification,
} from "@/lib/order-email";
import { calculateManualPaymentDiscount } from "@/lib/manual-payment";

import type { CheckoutRequest } from "@/app/api/checkout/schema";
import { eq } from "drizzle-orm";

function generateOrderId() {
  return crypto.randomUUID();
}

function generateOrderNumber() {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);

  const random = Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();

  return `PG-${Date.now()}-${random}`;
}

function isPaymentProofUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    return (
      url.protocol === "https:" &&
      url.hostname === "res.cloudinary.com" &&
      !!cloudName &&
      url.pathname.startsWith(`/${cloudName}/image/upload/`) &&
      url.pathname.includes("/checkout-payment-proofs/")
    );
  } catch {
    return false;
  }
}

export async function createCheckoutOrder(
  input: CheckoutRequest,
) {
  /*
   * IMPORTANT:
   *
   * The customer's prices are NOT trusted.
   *
   * createCheckoutQuote() re-fetches the products from the
   * database and resolves:
   *
   * - base product price
   * - option price deltas
   * - variant combinations
   * - variant price overrides
   * - variant availability
   */
  const checkoutItems: CheckoutItemInput[] =
    input.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      selectedOptions:
        item.selectedOptions ?? [],
    }));

  const methodResult = await db
    .select()
    .from(paymentMethods)
    .where(eq(paymentMethods.id, input.paymentMethodId))
    .limit(1);
  const method = methodResult[0];

  if (!method?.enabled) {
    throw new Error("That payment method is no longer available.");
  }

  const fieldsByKey = new Map(
    method.customerFields.map((field) => [field.key, field]),
  );
  const suppliedKeys = Object.keys(input.paymentDetails);
  if (suppliedKeys.some((key) => !fieldsByKey.has(key))) {
    throw new Error("Payment details do not match the selected method.");
  }

  const paymentDetails: Record<string, string> = {};
  for (const field of method.customerFields) {
    const value = input.paymentDetails[field.key]?.trim() ?? "";
    if (field.required && !value) {
      throw new Error(`${field.label} is required.`);
    }
    if (value) paymentDetails[field.label] = value;
  }

  if (method.isCrypto) {
    const wallet = method.wallets.find((item) => item.id === input.walletId);
    if (!wallet) {
      throw new Error("Choose a wallet for your crypto payment.");
    }
    paymentDetails["Selected wallet"] = `${wallet.name} (${wallet.network})`;
    paymentDetails["Wallet address"] = wallet.address;
    paymentDetails["Accepted asset"] = wallet.asset || "Not specified";
  } else if (input.walletId) {
    throw new Error("A crypto wallet was provided for a non-crypto method.");
  }

  if (method.requireProof && !input.paymentProofUrl) {
    throw new Error("A payment screenshot is required for this method.");
  }
  if (input.paymentProofUrl && !isPaymentProofUrl(input.paymentProofUrl)) {
    throw new Error("The payment screenshot URL is invalid.");
  }

  const quote = await createCheckoutQuote(checkoutItems);
  const discount = calculateManualPaymentDiscount(
    quote.subtotal,
    method.isCrypto,
    Number(method.discountPercent),
  );
  const total = Math.max(0, quote.total - discount);
  const orderId = generateOrderId();
  const orderNumber = generateOrderNumber();
  const invoiceNumber = `INV-${orderNumber.replace(/^PG-/, "")}`;
  const issuedAt = new Date();
  const subtotal = quote.subtotal.toFixed(2);
  const shipping = quote.shipping.toFixed(2);
  const tax = quote.tax.toFixed(2);
  const discountAmount = discount.toFixed(2);
  const totalAmount = total.toFixed(2);

  await db.insert(orders).values({
    id: orderId,
    orderNumber,
    email: input.customer.email,
    customerName: input.customer.name,
    phone: input.customer.phone,
    shippingLine1: input.customer.shippingLine1,
    shippingLine2: input.customer.shippingLine2 || null,
    city: input.customer.city,
    state: input.customer.state || null,
    postalCode: input.customer.postalCode,
    country: input.customer.country,
    subtotal,
    shipping,
    tax,
    total: totalAmount,
    currency: quote.currency,
    status: "pending",
    paymentStatus: "pending",
    paymentMethodId: method.id,
    paymentMethodName: method.name,
    paymentDetails,
    paymentDiscount: discountAmount,
    paymentProofUrl: input.paymentProofUrl || null,
    invoiceNumber,
    invoiceIssuedAt: issuedAt,
  });

  const savedItems = quote.items.map((item) => ({
    id: crypto.randomUUID(),
    orderId,
    productId: item.productId,
    productName: item.productName,
    selectedOptions: item.selectedOptions,
    unitPrice: item.unitPrice.toFixed(2),
    quantity: item.quantity,
    lineTotal: item.lineTotal.toFixed(2),
  }));

  try {
    await db.insert(orderItems).values(savedItems);
  } catch (error) {
    await db
      .update(orders)
      .set({ status: "failed", updatedAt: new Date() })
      .where(eq(orders.id, orderId));
    throw error;
  }

  const emailOrder = {
    orderNumber,
    invoiceNumber,
    issuedAt,
    customer: input.customer,
    paymentMethodName: method.name,
    paymentDetails,
    paymentProofUrl: input.paymentProofUrl,
    items: savedItems,
    subtotal,
    shipping,
    tax,
    discount: discountAmount,
    total: totalAmount,
    currency: quote.currency,
  };

  // Each email is independent: one failing must not block the other, and
  // neither may fail the checkout (the order is already saved).
  const [ownerResult, customerResult] = await Promise.allSettled([
    sendOwnerOrderNotification(emailOrder),
    sendCustomerOrderConfirmation(emailOrder),
  ]);

  const notificationSent = ownerResult.status === "fulfilled";
  if (ownerResult.status === "rejected") {
    console.error("Owner order notification failed:", ownerResult.reason);
  }
  if (customerResult.status === "rejected") {
    console.error("Customer order confirmation failed:", customerResult.reason);
  }

  try {
    const now = new Date();
    await db
      .update(orders)
      .set({
        ownerNotifiedAt: notificationSent ? now : null,
        customerConfirmedAt:
          customerResult.status === "fulfilled" ? now : null,
        updatedAt: now,
      })
      .where(eq(orders.id, orderId));
  } catch (error) {
    console.error("Failed to record email delivery:", error);
  }

  return {
    orderNumber,
    total,
    subtotal: quote.subtotal,
    discount,
    currency: quote.currency,
    paymentMethodName: method.name,
    notificationSent,
  };
}