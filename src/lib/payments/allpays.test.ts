import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildCanonicalQueryString,
  createAllPaysPayment,
  verifyAllPaysSignature,
} from "./allpays";

describe("AllPays canonical signing", () => {
  it("sorts query parameters in canonical order", () => {
    const params = new URLSearchParams(
      "b=second&a=first&c=third",
    );

    expect(buildCanonicalQueryString(params)).toBe(
      "a=first&b=second&c=third",
    );
  });

  it("accepts a valid HMAC signature", async () => {
    const secret = "test-secret";
    const timestamp = "1710000000";
    const url =
      "https://pluggeo.test/api/webhooks/allpays?b=second&a=first";

    const canonical =
      buildCanonicalQueryString(new URL(url).searchParams);
    const payload = `${timestamp}\n${canonical}`;

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

    const hexSignature = Array.from(
      new Uint8Array(signature),
    )
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");

    await expect(
      verifyAllPaysSignature({
        requestUrl: url,
        signature: hexSignature,
        timestamp,
        secret,
      }),
    ).resolves.toBe(true);
  });

  it("rejects an invalid signature", async () => {
    await expect(
      verifyAllPaysSignature({
        requestUrl:
          "https://pluggeo.test/api/webhooks/allpays?b=second&a=first",
        signature: "invalid-signature",
        timestamp: "1710000000",
        secret: "test-secret",
      }),
    ).resolves.toBe(false);
  });

  it("does not require a global API key for payment creation", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        payment_id: "pay_123",
        payment_secret: "secret_456",
        checkout_url: "https://checkout.example/pay/pay_123",
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    process.env.ALLPAYS_ENABLED = "true";
    process.env.ALLPAYS_MERCHANT_WALLET = "merchant-wallet-123";
    delete process.env.ALLPAYS_API_KEY;

    await expect(
      createAllPaysPayment({
        orderId: "order-1",
        orderNumber: "PG-123",
        amount: 42.5,
        currency: "USD",
        customerEmail: "buyer@example.com",
        customerName: "Buyer",
        description: "Test order",
        returnUrl: "https://pluggeo.test/checkout/success",
        cancelUrl: "https://pluggeo.test/checkout",
        callbackUrl: "https://pluggeo.test/api/webhooks/allpays?order=PG-123",
      }),
    ).resolves.toMatchObject({
      providerName: "allpays",
      providerPaymentId: "pay_123",
      providerPaymentSecret: "secret_456",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, requestInit] = fetchMock.mock.calls[0];
    expect(requestInit.headers.Authorization).toBeUndefined();

    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });
});
