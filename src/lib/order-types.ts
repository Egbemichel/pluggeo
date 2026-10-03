export type OrderEmailInput = {
  orderNumber: string;
  invoiceNumber: string;
  issuedAt: Date;
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

export function formatMoney(value: string | number, currency: string): string {
  const amount = Number(value);
  const formatted = amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return currency === "USD" ? `$${formatted}` : `${currency} ${formatted}`;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function addressLines(customer: OrderEmailInput["customer"]): string[] {
  return [
    customer.shippingLine1,
    customer.shippingLine2,
    [customer.city, customer.state, customer.postalCode]
      .filter(Boolean)
      .join(", "),
    customer.country,
  ].filter((line): line is string => Boolean(line));
}
