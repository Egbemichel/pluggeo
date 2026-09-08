import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { orders } from "@/db/schema";

export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      orderNumber: string;
    }>;
  },
) {
  const {
    orderNumber,
  } = await context.params;

  const result = await db
    .select({
      orderNumber:
        orders.orderNumber,

      status:
        orders.status,

      paymentStatus:
        orders.paymentStatus,

      total:
        orders.total,

      currency:
        orders.currency,
    })
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
    return NextResponse.json(
      {
        error: "Order not found.",
      },
      {
        status: 404,
      },
    );
  }

  return NextResponse.json({
    orderNumber:
      order.orderNumber,

    status:
      order.status,

    paymentStatus:
      order.paymentStatus,

    total:
      Number(order.total),

    currency:
      order.currency,
  });
}