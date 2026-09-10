import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { orders } from "@/db/schema";
import { verifyAllPaysSignature } from "@/lib/payments/allpays";

function parseNumeric(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const orderNumber = url.searchParams.get("order");
    const callbackToken = url.searchParams.get("token");
    const signature =
      request.headers.get("x-allpays-signature") || "";
    const timestamp =
      request.headers.get("x-allpays-timestamp") || "";

    if (!orderNumber || !callbackToken) {
      return new NextResponse("Invalid callback.", {
        status: 400,
      });
    }

    const orderResult = await db
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, orderNumber))
      .limit(1);

    const order = orderResult[0];

    if (!order) {
      return new NextResponse("Order not found.", {
        status: 404,
      });
    }

    if (order.paymentStatus === "paid") {
      return new NextResponse("OK", { status: 200 });
    }

    if (order.paymentCallbackToken !== callbackToken) {
      return new NextResponse("Invalid callback token.", {
        status: 403,
      });
    }

    if (order.paymentProvider !== "allpays") {
      return new NextResponse("Provider mismatch.", {
        status: 409,
      });
    }

    const paymentSecret = order.paymentProviderToken;

    if (!paymentSecret) {
      return new NextResponse("Missing provider secret.", {
        status: 500,
      });
    }

    const signatureValid = await verifyAllPaysSignature({
      requestUrl: request.url,
      signature,
      timestamp,
      secret: paymentSecret,
    });

    if (!signatureValid) {
      return new NextResponse("Invalid signature.", {
        status: 401,
      });
    }

    const paymentId = url.searchParams.get("payment_id");
    const paymentStatus =
      url.searchParams.get("status") ||
      url.searchParams.get("payment_status") ||
      "";
    const amountMatch =
      url.searchParams.get("amount_match_merchant") ||
      url.searchParams.get("amount_match_checkout") ||
      "";
    const receivedAmount =
      parseNumeric(
        url.searchParams.get("received_amount") ||
          url.searchParams.get("expected_merchant_amount") ||
          url.searchParams.get("expected_received_amount") ||
          url.searchParams.get("amount") ||
          null,
      ) ??
      parseNumeric(
        url.searchParams.get("value_coin") || null,
      );
    const providerCurrency =
      url.searchParams.get("received_currency") ||
      url.searchParams.get("currency") ||
      "USD";

    if (
      paymentId &&
      order.paymentProviderReference &&
      paymentId !== order.paymentProviderReference
    ) {
      return new NextResponse("Payment mismatch.", {
        status: 409,
      });
    }

    if (
      paymentStatus.toLowerCase() !== "completed" &&
      paymentStatus.toLowerCase() !== "success"
    ) {
      return new NextResponse("Payment not completed.", {
        status: 200,
      });
    }

    if (
      amountMatch &&
      amountMatch !== "exact"
    ) {
      return new NextResponse("Amount mismatch.", {
        status: 400,
      });
    }

    if (
      providerCurrency.toUpperCase() !== "USD" &&
      providerCurrency.toUpperCase() !== "USDC"
    ) {
      return new NextResponse("Currency mismatch.", {
        status: 400,
      });
    }

    if (
      receivedAmount !== null &&
      Number(order.total) > 0 &&
      receivedAmount < Number(order.total) - 0.01
    ) {
      return new NextResponse("Insufficient payment.", {
        status: 400,
      });
    }

    await db
      .update(orders)
      .set({
        paymentStatus: "paid",
        status: "processing",
        txidIn:
          url.searchParams.get("txid_in") || null,
        txidOut:
          url.searchParams.get("txid_out") || null,
        paymentValueCoin:
          receivedAmount !== null
            ? receivedAmount.toString()
            : null,
        paymentCoin:
          url.searchParams.get("coin") || null,
        paymentValueForwardedCoin:
          parseNumeric(
            url.searchParams.get("received_amount") ||
              url.searchParams.get("value_forwarded_coin") ||
              null,
          )?.toString() || null,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id));

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("AllPays webhook failed:", error);

    return new NextResponse("Internal server error.", {
      status: 500,
    });
  }
}
