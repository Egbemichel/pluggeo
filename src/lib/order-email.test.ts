import { afterEach, describe, expect, it, vi } from "vitest";

import {
  sendCustomerOrderConfirmation,
  sendOwnerOrderNotification,
  type OrderEmailInput,
} from "./order-email";

const order: OrderEmailInput = {
  orderNumber: "PG-123",
  invoiceNumber: "INV-123",
  issuedAt: new Date("2026-10-03T12:00:00Z"),
  customer: {
    name: "Jordan <Buyer>",
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
  items: [
    {
      productName: "Gold chain \u2728",
      selectedOptions: ["20 inch"],
      quantity: 2,
      unitPrice: "400.00",
      lineTotal: "800.00",
    },
  ],
  subtotal: "800.00",
  shipping: "0.00",
  tax: "0.00",
  discount: "80.00",
  total: "720.00",
  currency: "USD",
};

function stubEnv() {
  vi.stubEnv("RESEND_API_KEY", "re_test_key");
  vi.stubEnv("RESEND_FROM_EMAIL", "orders@example.com");
  vi.stubEnv("ORDER_NOTIFICATION_EMAIL", "owner@example.com");
}

describe("order emails", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("sends the owner a styled email with the invoice PDF attached", async () => {
    stubEnv();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    await sendOwnerOrderNotification(order);

    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body.to).toEqual(["owner@example.com"]);
    expect(body.html).toContain("PG-123");
    expect(body.html).toContain("jordan@example.com");
    expect(body.html).toContain("https://wa.me/15555550100");
    expect(body.html).toContain("Jordan &lt;Buyer&gt;");
    expect(body.text).toContain("2 x Gold chain");
    expect(body.attachments).toHaveLength(1);
    expect(body.attachments[0].filename).toBe("INV-123.pdf");
    const pdf = Buffer.from(body.attachments[0].content, "base64");
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
  });

  it("sends the customer a confirmation to their own address", async () => {
    stubEnv();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    await sendCustomerOrderConfirmation(order);

    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body.to).toEqual(["jordan@example.com"]);
    expect(body.subject).toContain("PG-123");
    expect(body.html).toContain("Order received!");
    expect(body.html).toContain("Payment discount");
    expect(body.attachments).toBeUndefined();
  });

  it("fails clearly when Resend is not configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("RESEND_FROM_EMAIL", "");
    vi.stubEnv("ORDER_NOTIFICATION_EMAIL", "");

    await expect(sendOwnerOrderNotification(order)).rejects.toThrow(
      "Order email is not configured",
    );
    await expect(sendCustomerOrderConfirmation(order)).rejects.toThrow(
      "Order email is not configured",
    );
  });
});
