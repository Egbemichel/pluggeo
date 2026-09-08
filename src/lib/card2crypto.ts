import { z } from "zod";

const CARD2CRYPTO_API =
  "https://api.card2crypto.org";

const CARD2CRYPTO_PAYMENT =
  "https://pay.card2crypto.org/process-payment.php";

const walletResponseSchema = z.object({
  address_in: z.string().min(1),
  polygon_address_in: z.string().min(1),
  callback_url: z.string().min(1),
  ipn_token: z.string().min(1),
});

const providerSchema = z.object({
  id: z.string().min(1),
  provider_name: z.string().min(1),
  status: z.string(),
  minimum_currency: z.string(),
  minimum_amount: z.coerce.number(),
});

const providersResponseSchema = z.object({
  providers: z.array(providerSchema),
});

export type Card2CryptoProvider = z.infer<
  typeof providerSchema
>;

export type Card2CryptoWallet = z.infer<
  typeof walletResponseSchema
>;

function getWalletAddress(): string {
  const address = process.env.CARD2CRYPTO_USDC_WALLET;

  if (!address) {
    throw new Error(
      "CARD2CRYPTO_USDC_WALLET is not configured.",
    );
  }

  return address;
}

export async function createTemporaryWallet(
  callbackUrl: string,
): Promise<Card2CryptoWallet> {
  const url = new URL(
    `${CARD2CRYPTO_API}/control/wallet.php`,
  );

  url.searchParams.set("address", getWalletAddress());
  url.searchParams.set("callback", callbackUrl);

  const response = await fetch(url.toString(), {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Card2Crypto wallet request failed: ${response.status}`,
    );
  }

  const json: unknown = await response.json();

  return walletResponseSchema.parse(json);
}

export async function getProviders(): Promise<
  Card2CryptoProvider[]
> {
  const response = await fetch(
    `${CARD2CRYPTO_API}/control/provider-status`,
    {
      method: "GET",
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      `Card2Crypto provider request failed: ${response.status}`,
    );
  }

  const json: unknown = await response.json();

  const parsed =
    providersResponseSchema.parse(json);

  return parsed.providers;
}

export function selectProvider(
  providers: Card2CryptoProvider[],
  amount: number,
): Card2CryptoProvider {
  const configuredProvider =
    process.env.CARD2CRYPTO_PROVIDER_ID;

  if (configuredProvider) {
    const provider = providers.find(
      (item) => item.id === configuredProvider,
    );

    if (!provider) {
      throw new Error(
        `Configured Card2Crypto provider "${configuredProvider}" was not found.`,
      );
    }

    if (provider.status !== "active") {
      throw new Error(
        `Configured Card2Crypto provider "${configuredProvider}" is not active.`,
      );
    }

    if (
      provider.minimum_currency.toUpperCase() ===
        "USD" &&
      amount < provider.minimum_amount
    ) {
      throw new Error(
        `Order amount is below the minimum for Card2Crypto provider "${configuredProvider}".`,
      );
    }

    return provider;
  }

  const provider = providers.find(
    (item) =>
      item.status === "active" &&
      item.minimum_currency.toUpperCase() ===
        "USD" &&
      amount >= item.minimum_amount,
  );

  if (!provider) {
    throw new Error(
      "No active Card2Crypto provider can process this USD order amount.",
    );
  }

  return provider;
}

export function buildPaymentUrl({
  address,
  amount,
  provider,
  email,
  currency,
}: {
  address: string;
  amount: number;
  provider: string;
  email: string;
  currency: string;
}): string {
  const url = new URL(CARD2CRYPTO_PAYMENT);

  url.searchParams.set("address", address);
  url.searchParams.set(
    "amount",
    amount.toFixed(2),
  );
  url.searchParams.set("provider", provider);
  url.searchParams.set("email", email);
  url.searchParams.set("currency", currency);

  return url.toString();
}