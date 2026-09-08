import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { orders } from "@/db/schema";

function parseAmount(
  value: string | null,
) {
  if (!value) return null;

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return null;
  }

  return amount;
}

export async function GET(
  request: Request,
) {
  try {
    const url = new URL(request.url);

    const orderNumber =
      url.searchParams.get("order");

    const token =
      url.searchParams.get("token");

    const valueCoin =
      parseAmount(
        url.searchParams.get(
          "value_coin",
        ),
      );

    const valueForwardedCoin =
      parseAmount(
        url.searchParams.get(
          "value_forwarded_coin",
        ),
      );

    const coin =
      url.searchParams.get("coin");

    const txidIn =
      url.searchParams.get("txid_in");

    const txidOut =
      url.searchParams.get("txid_out");

    const addressIn =
      url.searchParams.get("address_in");

    if (
      !orderNumber ||
      !token ||
      valueCoin === null ||
      !coin ||
      !addressIn
    ) {
      return new NextResponse(
        "Invalid callback.",
        {
          status: 400,
        },
      );
    }

    const result = await db
      .select()
      .from(orders)
      .where(
        eq(
          orders.orderNumber,
          orderNumber,
        ),
      )
      .limit(1);

    const order = result[0];

    if (!order) {
      return new NextResponse(
        "Order not found.",
        {
          status: 404,
        },
      );
    }

    if (
      order.paymentStatus === "paid"
    ) {
      return new NextResponse(
        "OK",
        {
          status: 200,
        },
      );
    }

    if (
      order.paymentCallbackToken !==
      token
    ) {
      return new NextResponse(
        "Invalid callback token.",
        {
          status: 403,
        },
      );
    }

    if (
      order.paymentPolygonAddress?.toLowerCase() !==
      addressIn.toLowerCase()
    ) {
      return new NextResponse(
        "Invalid payment address.",
        {
          status: 403,
        },
      );
    }

    if (
      coin.toLowerCase() !==
        "polygon_usdc" &&
      coin.toLowerCase() !==
        "usdc"
    ) {
      return new NextResponse(
        "Unsupported payment coin.",
        {
          status: 400,
        },
      );
    }

    const expectedAmount =
      Number(order.total);

    if (
      valueCoin + 0.000001 <
      expectedAmount
    ) {
      return new NextResponse(
        "Insufficient payment.",
        {
          status: 400,
        },
      );
    }

    await db
      .update(orders)
      .set({
        paymentStatus: "paid",
        status: "processing",

        txidIn:
          txidIn || null,

        txidOut:
          txidOut || null,

        paymentValueCoin:
          valueCoin.toString(),

        paymentCoin:
          coin,

        paymentValueForwardedCoin:
          valueForwardedCoin !==
          null
            ? valueForwardedCoin.toString()
            : null,

        updatedAt: new Date(),
      })
      .where(
        eq(
          orders.id,
          order.id,
        ),
      );

    return new NextResponse(
      "OK",
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(
      "Card2Crypto callback failed:",
      error,
    );

    return new NextResponse(
      "Internal server error.",
      {
        status: 500,
      },
    );
  }
}