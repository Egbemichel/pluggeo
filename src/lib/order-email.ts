type OrderEmailInput = {
  orderNumber: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    shippingLine1: string;
    shippingLine2?: string | null;
    city: string;
    state?: string | null;
    postalCode: string;
    country: string;
  };
  paymentMethodName: string;
  paymentDetails: Record<string, string>;
  paymentProofUrl?: string | null;
  items: Array<{
    productName: string;
    selectedOptions: string[];
    quantity: number;
    unitPrice: string;
    lineTotal: string;
  }>;
  subtotal: string;
  shipping: string;
  tax: string;
  discount: string;
  total: string;
  currency: string;
};

function formatAddress(customer: OrderEmailInput["customer"]): string {
  return [
    customer.shippingLine1,
    customer.shippingLine2,
    [customer.city, customer.state, customer.postalCode]
      .filter(Boolean)
      .join(", "),
    customer.country,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function sendOwnerOrderNotification(
  order: OrderEmailInput,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const recipient = process.env.ORDER_NOTIFICATION_EMAIL;
  const sender = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !recipient || !sender) {
    throw new Error(
      "Order email is not configured. Set RESEND_API_KEY, ORDER_NOTIFICATION_EMAIL, and RESEND_FROM_EMAIL.",
    );
  }

  const lines = [
    "NEW PLUG GEO ORDER",
    "",
    `Order: ${order.orderNumber}`,
    "",
    "Customer:",
    order.customer.name,
    order.customer.email,
    order.customer.phone,
    "",
    `Payment method: ${order.paymentMethodName}`,
    ...Object.entries(order.paymentDetails).map(
      ([key, value]) => `${key}: ${value}`,
    ),
    `Payment proof: ${order.paymentProofUrl || "Not provided"}`,
    "",
    "Shipping:",
    formatAddress(order.customer),
    "",
    "Items:",
    ...order.items.map((item) => {
      const options = item.selectedOptions.length
        ? ` (${item.selectedOptions.join(", ")})`
        : "";
      return `${item.quantity} x ${item.productName}${options} | ${order.currency} ${item.unitPrice} each | ${order.currency} ${item.lineTotal}`;
    }),
    "",
    `Subtotal: ${order.currency} ${order.subtotal}`,
    `Shipping: ${order.currency} ${order.shipping}`,
    `Tax: ${order.currency} ${order.tax}`,
    `Payment discount: -${order.currency} ${order.discount}`,
    `Total: ${order.currency} ${order.total}`,
  ];

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: sender,
      to: [recipient],
      subject: `New order ${order.orderNumber}`,
      text: lines.join("\n"),
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Resend email failed (${response.status}): ${detail}`);
  }
}
