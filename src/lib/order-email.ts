import { generateInvoicePdf } from "@/lib/invoice-pdf";
import {
  renderCustomerEmail,
  renderOwnerEmail,
} from "@/lib/order-email-templates";
import type { OrderEmailInput } from "@/lib/order-types";

export type { OrderEmailInput } from "@/lib/order-types";

type ResendAttachment = { filename: string; content: string };

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function sendViaResend(message: {
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments?: ResendAttachment[];
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const sender = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !sender) {
    throw new Error(
      "Order email is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL.",
    );
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: sender,
      to: [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
      ...(message.attachments ? { attachments: message.attachments } : {}),
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Resend email failed (${response.status}): ${detail}`);
  }
}

export async function sendOwnerOrderNotification(
  order: OrderEmailInput,
): Promise<void> {
  const recipient = process.env.ORDER_NOTIFICATION_EMAIL;
  if (!recipient) {
    throw new Error(
      "Order email is not configured. Set ORDER_NOTIFICATION_EMAIL.",
    );
  }

  const { subject, html, text } = renderOwnerEmail(order);
  const pdf = await generateInvoicePdf(order);

  await sendViaResend({
    to: recipient,
    subject,
    html,
    text,
    attachments: [
      { filename: `${order.invoiceNumber}.pdf`, content: toBase64(pdf) },
    ],
  });
}

export async function sendCustomerOrderConfirmation(
  order: OrderEmailInput,
): Promise<void> {
  const { subject, html, text } = renderCustomerEmail(order);
  await sendViaResend({ to: order.customer.email, subject, html, text });
}
