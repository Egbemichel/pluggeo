import { eq } from "drizzle-orm";

import { db } from "@/db";
import {
  orders,
  orderItems,
} from "@/db/schema";

import {
  buildPaymentUrl,
  createTemporaryWallet,
  getProviders,
  selectProvider,
} from "@/lib/card2crypto";

import {
  createAllPaysPayment,
  isAllPaysEnabled,
} from "@/lib/payments/allpays";

import {
  createCheckoutQuote,
  type CheckoutItemInput,
} from "@/lib/checkout";

import type { CheckoutRequest } from "@/app/api/checkout/schema";

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

function generateCallbackToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);

  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
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

  const quote = await createCheckoutQuote(
    checkoutItems,
  );

  const orderId = generateOrderId();
  const orderNumber = generateOrderNumber();
  const callbackToken = generateCallbackToken();
  const requestedProvider =
    (input.paymentProvider || "card2crypto")
      .trim()
      .toLowerCase();

  const siteUrl =
    process.env.APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL;

  if (!siteUrl) {
    throw new Error(
      "APP_URL or NEXT_PUBLIC_SITE_URL is not configured.",
    );
  }

  const callbackUrl = new URL(
    "/api/payments/card2crypto/callback",
    siteUrl,
  );

  /*
   * Card2Crypto requires the callback URL to contain
   * at least one unique GET parameter per request.
   *
   * We provide both the order number and a unique token.
   */
  callbackUrl.searchParams.set(
    "order",
    orderNumber,
  );

  callbackUrl.searchParams.set(
    "token",
    callbackToken,
  );

  const order = {
    id: orderId,
    orderNumber,

    email: input.customer.email,
    customerName: input.customer.name,
    phone: input.customer.phone,

    shippingLine1:
      input.customer.shippingLine1,

    shippingLine2:
      input.customer.shippingLine2 || null,

    city: input.customer.city,

    state:
      input.customer.state || null,

    postalCode:
      input.customer.postalCode,

    country:
      input.customer.country,

    subtotal: quote.subtotal.toFixed(2),
    shipping: quote.shipping.toFixed(2),
    tax: quote.tax.toFixed(2),
    total: quote.total.toFixed(2),

    currency: quote.currency,

    status: "pending",
    paymentStatus: "pending",

    paymentCallbackToken:
      callbackToken,
  };

  /*
   * Create the order first.
   *
   * Neon HTTP does not support Drizzle transactions, so the
   * order items are inserted as one batch immediately afterward.
   */
  await db
    .insert(orders)
    .values(order);

  try {
    /*
     * Persist the server-resolved order snapshot.
     *
     * These prices are now independent of whatever happens
     * to the product price later.
     */
    await db
      .insert(orderItems)
      .values(
        quote.items.map((item) => ({
          id: crypto.randomUUID(),

          orderId,

          /*
           * Stored as text in order_items, so the UUID from
           * products.id is safely preserved as a string.
           */
          productId: item.productId,

          productName: item.productName,

          selectedOptions:
            item.selectedOptions,

          unitPrice:
            item.unitPrice.toFixed(2),

          quantity:
            item.quantity,

          lineTotal:
            item.lineTotal.toFixed(2),
        })),
      );

    let paymentUrl = "";
    let paymentProviderName = requestedProvider;

    if (requestedProvider === "allpays") {
      if (!isAllPaysEnabled()) {
        throw new Error(
          "AllPays is not enabled for this environment.",
        );
      }

      const allPaysResult = await createAllPaysPayment({
        orderId,
        orderNumber,
        amount: quote.total,
        currency: quote.currency,
        customerEmail: input.customer.email,
        customerName: input.customer.name,
        description: `Plug Geo order ${orderNumber}`,
        returnUrl: new URL(
          `/checkout/success?order=${encodeURIComponent(orderNumber)}`,
          siteUrl,
        ).toString(),
        cancelUrl: new URL(
          `/checkout?order=${encodeURIComponent(orderNumber)}`,
          siteUrl,
        ).toString(),
        callbackUrl: callbackUrl.toString(),
      });

      paymentUrl = allPaysResult.paymentUrl;
      paymentProviderName = allPaysResult.providerName;

      await db
        .update(orders)
        .set({
          paymentProvider:
            paymentProviderName,
          paymentProviderReference:
            allPaysResult.providerPaymentId || null,
          paymentProviderToken:
            allPaysResult.providerPaymentSecret || null,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));
    } else {
      /*
       * STEP 1 — Generate the temporary Card2Crypto wallet.
       */
      const wallet =
        await createTemporaryWallet(
          callbackUrl.toString(),
        );

      /*
       * STEP 2 — Get the currently available payment
       * providers from Card2Crypto and validate the
       * customer's explicit provider choice.
       */
      const providers =
        await getProviders();

      const provider =
        selectProvider(
          providers,
          quote.total,
          quote.currency,
          input.paymentProvider,
        );

      /*
       * STEP 3 — Build the actual Card2Crypto
       * process-payment.php URL.
       *
       * The documented parameters are:
       *
       * address
       * amount
       * provider
       * email
       * currency
       */
      paymentUrl = buildPaymentUrl({
        address:
          wallet.address_in,

        amount:
          quote.total,

        provider:
          provider.id,

        email:
          input.customer.email,

        currency:
          quote.currency,
      });

      /*
       * Store everything we need to validate the eventual
       * Card2Crypto callback.
       */
      await db
        .update(orders)
        .set({
          paymentProvider:
            provider.id,

          paymentProviderToken:
            wallet.ipn_token,

          paymentAddress:
            wallet.address_in,

          paymentPolygonAddress:
            wallet.polygon_address_in,

          updatedAt:
            new Date(),
        })
        .where(
          eq(orders.id, orderId),
        );
    }

    return {
      orderNumber,

      paymentUrl,

      total:
        quote.total,

      currency:
        quote.currency,

      paymentProvider:
        paymentProviderName,
    };
  } catch (error) {
    /*
     * The order exists so there is an audit trail, but payment
     * initialization failed.
     */
    await db
      .update(orders)
      .set({
        paymentStatus:
          "failed",

        updatedAt:
          new Date(),
      })
      .where(
        eq(orders.id, orderId),
      );

    throw error;
  }
}