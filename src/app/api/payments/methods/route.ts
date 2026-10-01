import { NextResponse } from "next/server";

import { getEnabledPaymentMethods } from "@/lib/payment-methods";

export async function GET() {
  try {
    const methods = await getEnabledPaymentMethods();
    return NextResponse.json({ methods }, { status: 200 });
  } catch (error) {
    console.error("Payment method lookup failed:", error);
    return NextResponse.json(
      { error: "Payment methods are temporarily unavailable." },
      { status: 500 },
    );
  }
}
