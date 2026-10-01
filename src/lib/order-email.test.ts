import { afterEach, describe, expect, it, vi } from "vitest";

import { sendOwnerOrderNotification } from "./order-email";

describe("sendOwnerOrderNotification", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("sends the complete order and customer details through Resend", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.stubEnv("RESEND_FROM_EMAIL", "orders@example.com");
    vi.stubEnv("ORDER_NOTIFICATION_EMAIL", "owner@example.com");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    await sendOwnerOrderNotification({
      orderNumber: "PG-123",
      customer: {
        name: "Jordan Buyer",
        email: "jordan@example.com",
        phone: "+15555550100",
        shippingLine1: "10 Main Street",
        shippingLine2: "Suite 3",
        city: "New York",
        state: "NY",
        postalCode: "10001",
        country: "United States",
      },
      paymentMethodName: "Cash App",
      paymentDetails: { "$Cashtag": "$jordan" },
      paymentProofUrl: "https://res.cloudinary.com/demo/image/upload/proof.png",
      items: [{
        productName: "Gold chain",
        selectedOptions: ["20 inch"],
        quantity: 2,
        unitPrice: "400.00",
        lineTotal: "800.00",
      }],
      subtotal: "800.00",
      shipping: "0.00",
      tax: "0.00",
      discount: "0.00",
      total: "800.00",
      currency: "USD",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({ method: "POST" }),
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body.to).toEqual(["owner@example.com"]);
    expect(body.text).toContain("PG-123");
    expect(body.text).toContain("jordan@example.com");
    expect(body.text).toContain("+15555550100");
    expect(body.text).toContain("$jordan");
    expect(body.text).toContain("proof.png");
    expect(body.text).toContain("2 x Gold chain (20 inch)");
    expect(body.text).toContain("Total: USD 800.00");
  });

  it("fails clearly when the Resend destination is not configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("RESEND_FROM_EMAIL", "");
    vi.stubEnv("ORDER_NOTIFICATION_EMAIL", "");

    await expect(
      sendOwnerOrderNotification({
        orderNumber: "PG-124",
        customer: {
          name: "Jordan Buyer",
          email: "jordan@example.com",
          phone: "+15555550100",
          shippingLine1: "10 Main Street",
          city: "New York",
          postalCode: "10001",
          country: "United States",
        },
        paymentMethodName: "Card",
        paymentDetails: {},
        items: [],
        subtotal: "0.00",
        shipping: "0.00",
        tax: "0.00",
        discount: "0.00",
        total: "0.00",
        currency: "USD",
      }),
    ).rejects.toThrow("Order email is not configured");
  });
});
