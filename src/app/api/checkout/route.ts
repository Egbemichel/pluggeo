import { NextResponse } from "next/server";

import {
  checkoutRequestSchema,
} from "./schema";

import {
  createCheckoutOrder,
} from "@/lib/orders";

export async function POST(
  request: Request,
) {
  try {
    const body =
      await request.json();

    const parsed =
      checkoutRequestSchema.safeParse(
        body,
      );

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            "Invalid checkout information.",
        },
        {
          status: 400,
        },
      );
    }

    const result =
      await createCheckoutOrder(
        parsed.data,
      );

    return NextResponse.json(
      result,
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(
      "Checkout initialization failed:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to initialize checkout.",
      },
      {
        status: 500,
      },
    );
  }
}