import { describe, expect, it } from "vitest";

import { paymentMethodInputSchema } from "./payment-method-schema";

const baseMethod = {
  name: "Crypto",
  slug: "crypto",
  description: "Pay with crypto",
  instructions: "Use the selected network.",
  enabled: true,
  isCrypto: true,
  requireProof: true,
  discountPercent: 10,
  customerFields: [],
  wallets: [
    {
      id: "polygon-wallet",
      name: "Polygon wallet",
      network: "Polygon",
      address: "0xA96097ADae24bdaad284Fa3E555e798CFEeEBaF4",
      asset: "USDC",
    },
  ],
  sortOrder: 1,
};

describe("paymentMethodInputSchema", () => {
  it("accepts a configured crypto method with proof and a wallet", () => {
    expect(paymentMethodInputSchema.safeParse(baseMethod).success).toBe(true);
  });

  it("rejects discounts for non-crypto methods", () => {
    const result = paymentMethodInputSchema.safeParse({
      ...baseMethod,
      isCrypto: false,
      discountPercent: 10,
    });

    expect(result.success).toBe(false);
  });

  it("rejects duplicate customer field keys", () => {
    const result = paymentMethodInputSchema.safeParse({
      ...baseMethod,
      customerFields: [
        { key: "handle", label: "Handle", required: true },
        { key: "handle", label: "Second handle", required: false },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("requires a wallet for crypto methods", () => {
    const result = paymentMethodInputSchema.safeParse({
      ...baseMethod,
      wallets: [],
    });

    expect(result.success).toBe(false);
  });
});
