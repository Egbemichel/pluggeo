import { describe, expect, it } from "vitest";

import { calculateManualPaymentDiscount } from "./manual-payment";

describe("calculateManualPaymentDiscount", () => {
  it("discounts only the merchandise subtotal for crypto", () => {
    expect(calculateManualPaymentDiscount(850, true, 10)).toBe(85);
    expect(calculateManualPaymentDiscount(12.34, true, 10)).toBe(1.23);
  });

  it("does not discount non-crypto methods", () => {
    expect(calculateManualPaymentDiscount(850, false, 10)).toBe(0);
  });

  it("bounds malformed percentages and never exceeds the subtotal", () => {
    expect(calculateManualPaymentDiscount(850, true, 120)).toBe(850);
    expect(calculateManualPaymentDiscount(850, true, -5)).toBe(0);
  });
});
