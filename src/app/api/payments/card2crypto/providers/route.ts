import { NextResponse } from "next/server";

import { getProviders } from "@/lib/card2crypto";
import { isAllPaysEnabled } from "@/lib/payments/allpays";

export async function GET() {
  try {
    const providers = await getProviders();
    const providerList = providers
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
      }));

    if (isAllPaysEnabled()) {
      providerList.unshift({
        id: "allpays",
        providerName: "AllPays",
        status: "active",
        minimumCurrency: "USD",
        minimumAmount: 0,
      });
    }

    return NextResponse.json(
      {
        providers: providerList,
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
