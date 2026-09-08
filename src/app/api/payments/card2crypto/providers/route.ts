import { NextResponse } from "next/server";

import { getProviders } from "@/lib/card2crypto";

export async function GET() {
  try {
    const providers = await getProviders();

    return NextResponse.json(
      {
        providers: providers
          .filter(
            (provider) =>
              provider.status === "active",
          )
          .map((provider) => ({
            id: provider.id,
            providerName: provider.provider_name,
            status: provider.status,
            minimumCurrency:
              provider.minimum_currency,
            minimumAmount:
              provider.minimum_amount,
          })),
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(
      "Card2Crypto provider lookup failed:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load payment providers.",
      },
      {
        status: 500,
      },
    );
  }
}
