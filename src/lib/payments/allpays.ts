import { z } from "zod";

import type {
  PaymentCreationInput,
  PaymentCreationResult,
} from "./provider";

const ALLPAYS_API_BASE_URL =
  process.env.ALLPAYS_API_BASE_URL?.replace(/\/$/, "") ||
  "https://api.allpays.co";

const allPaysPaymentResponseSchema = z.object({
  payment_id: z.string().min(1).optional(),
  id: z.union([
    z.string().min(1),
    z.number().transform(String),
  ]).optional(),
  payment_secret: z.string().min(1).optional(),
  hosted_payment_url: z.string().url().optional(),
  checkout_url: z.string().url().optional(),
  payment_url: z.string().url().optional(),
  redirect_url: z.string().url().optional(),
  status: z.string().optional(),
  data: z.unknown().optional(),
});

export type AllPaysPaymentResponse =
  z.infer<typeof allPaysPaymentResponseSchema>;

export function isAllPaysEnabled(): boolean {
  const enabled =
    process.env.ALLPAYS_ENABLED?.trim().toLowerCase();

  return enabled === "true" || enabled === "1" || enabled === "yes";
}

export function getAllPaysMerchantWallet(): string {
  const wallet =
    process.env.ALLPAYS_MERCHANT_WALLET?.trim();

  if (!wallet) {
    throw new Error(
      "ALLPAYS_MERCHANT_WALLET is not configured.",
    );
  }

  return wallet;
}

export function getAllPaysSettlementAsset(): string {
  return (
    process.env.ALLPAYS_SETTLEMENT_ASSET?.trim() || "USDC"
  );
}

export function buildCanonicalQueryString(
  searchParams: URLSearchParams,
): string {
  const entries = Array.from(
    searchParams.entries(),
  ).sort(([leftKey, leftValue], [rightKey, rightValue]) => {
    const keyComparison = leftKey.localeCompare(rightKey);

    if (keyComparison !== 0) {
      return keyComparison;
    }

    return leftValue.localeCompare(rightValue);
  });

  return entries
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
    )
    .join("&");
}

async function hmacSha256Hex(
  secret: string,
  payload: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload),
  );

  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(
  left: string,
  right: string,
): boolean {
  const leftBytes = new TextEncoder().encode(left);
  const rightBytes = new TextEncoder().encode(right);

  if (leftBytes.length !== rightBytes.length) {
    return false;
  }

  let diff = 0;

  for (let index = 0; index < leftBytes.length; index += 1) {
    diff |= leftBytes[index] ^ rightBytes[index];
  }

  return diff === 0;
}

export async function verifyAllPaysSignature({
  requestUrl,
  signature,
  timestamp,
  secret,
}: {
  requestUrl: string;
  signature: string;
  timestamp: string;
  secret: string;
}): Promise<boolean> {
  if (!requestUrl || !signature || !timestamp) {
    return false;
  }

  const url = new URL(requestUrl);
  const canonicalQueryString =
    buildCanonicalQueryString(url.searchParams);

  const payload = `${timestamp}\n${canonicalQueryString}`;
  const expectedSignature =
    await hmacSha256Hex(secret, payload);

  return timingSafeEqual(
    expectedSignature.toLowerCase(),
    signature.toLowerCase(),
  );
}

export async function createAllPaysPayment(
  input: PaymentCreationInput,
): Promise<PaymentCreationResult> {
  if (!isAllPaysEnabled()) {
    throw new Error(
      "AllPays is disabled in the current environment.",
    );
  }

  const merchantWallet =
    getAllPaysMerchantWallet();

  const body = {
    polygon_address: merchantWallet,
    amount_editable: false,
    fee_payer: "customer" as const,
    amount: Number(input.amount.toFixed(2)),
    currency: input.currency || "USD",
    settlement_asset:
      getAllPaysSettlementAsset(),
    callback_url: input.callbackUrl,
    return_url: input.returnUrl,
    cancel_url: input.cancelUrl,
    email: input.customerEmail,
    customer_name: input.customerName,
    name: input.customerName,
    description: input.description,
    order_id: input.orderId,
    order_number: input.orderNumber,
    external_order_id: input.orderNumber,
  };

  if (
    typeof body.polygon_address !== "string" ||
    !body.polygon_address
  ) {
    throw new Error(
      "AllPays polygon_address is missing.",
    );
  }

  if (body.amount_editable !== false) {
    throw new Error(
      "AllPays amount_editable must be false for Plug Geo.",
    );
  }

  if (
    body.fee_payer !== "customer" &&
    body.fee_payer !== "merchant"
  ) {
    throw new Error(
      "AllPays fee_payer must be customer or merchant.",
    );
  }

  console.info("AllPays payment creation payload", {
    polygon_address_present: !!body.polygon_address,
    amount_editable: body.amount_editable,
    fee_payer: body.fee_payer,
    amount: body.amount,
    currency: body.currency,
  });

  const response = await fetch(
    `${ALLPAYS_API_BASE_URL}/v1/payments`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Language": "en",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `AllPays payment creation failed: ${response.status} ${errorText}`,
    );
  }

  const json: unknown = await response.json();

  const rootObject =
    typeof json === "object" && json !== null
      ? (json as Record<string, unknown>)
      : {};

  const nestedData =
    typeof rootObject.data === "object" &&
    rootObject.data !== null
      ? (rootObject.data as Record<string, unknown>)
      : {};

  const normalizedPayment = {
    ...nestedData,
    ...rootObject,
  };

  const paymentId =
    typeof normalizedPayment.payment_id === "string"
      ? normalizedPayment.payment_id
      : typeof normalizedPayment.id === "string"
        ? normalizedPayment.id
        : typeof normalizedPayment.id === "number"
          ? String(normalizedPayment.id)
          : undefined;

  const paymentSecret =
    typeof normalizedPayment.payment_secret === "string"
      ? normalizedPayment.payment_secret
      : undefined;

  const paymentUrl =
    typeof normalizedPayment.hosted_payment_url === "string"
      ? normalizedPayment.hosted_payment_url
      : typeof normalizedPayment.checkout_url === "string"
        ? normalizedPayment.checkout_url
        : typeof normalizedPayment.payment_url === "string"
          ? normalizedPayment.payment_url
          : typeof normalizedPayment.redirect_url === "string"
            ? normalizedPayment.redirect_url
            : undefined;

  if (!paymentId || !paymentUrl) {
    throw new Error(
      "AllPays did not return a usable payment identifier or checkout URL.",
    );
  }

  return {
    providerName: "allpays",
    paymentUrl,
    providerPaymentId: paymentId,
    providerPaymentSecret: paymentSecret,
  };
}
