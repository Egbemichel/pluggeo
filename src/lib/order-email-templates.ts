import {
  addressLines,
  formatDate,
  formatMoney,
  type OrderEmailInput,
} from "@/lib/order-types";

// Email clients ignore external CSS, so everything is inline, table-based and
// uses the pluggeo&co palette (navy / black / white / gray) from
// docs/DESIGN_SYSTEM.md as literal hex values.
const NAVY = "#141B34";
const GRAY = "#727272";
const INK = "#111111";
const LINE = "#E6E8EE";
const PAGE_BG = "#F2F3F7";
const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://pluggeoandco.shop").replace(/\/$/, "");
}

function shell(opts: { preheader: string; title: string; body: string }): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">
<title>${esc(opts.title)}</title></head>
<body style="margin:0;padding:0;background:${PAGE_BG};font-family:${FONT};color:${INK};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(opts.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAGE_BG};padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;">
<tr><td style="background:${NAVY};padding:26px 32px;">
<a href="${siteUrl()}" style="font-family:${FONT};font-size:22px;font-weight:700;letter-spacing:0.5px;color:#ffffff;text-decoration:none;">pluggeo&amp;co</a>
</td></tr>
${opts.body}
<tr><td style="background:${PAGE_BG};padding:20px 32px;font-size:12px;color:${GRAY};line-height:1.6;">
<a href="${siteUrl()}" style="color:${NAVY};text-decoration:none;font-weight:600;">pluggeoandco.shop</a>
<span style="float:right;">&copy; ${new Date().getUTCFullYear()} pluggeo&amp;co</span>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function metaCell(label: string, value: string): string {
  return `<td valign="top" style="padding:0 12px 16px 0;font-size:13px;line-height:1.5;">
<div style="color:${GRAY};font-size:12px;">${esc(label)}</div>
<div style="color:${INK};font-weight:600;">${value}</div></td>`;
}

function itemRows(order: OrderEmailInput): string {
  return order.items
    .map((item) => {
      const options = item.selectedOptions.length
        ? `<div style="color:${GRAY};font-size:12px;line-height:1.6;">${item.selectedOptions
            .map((o) => esc(o))
            .join("<br>")}</div>`
        : "";
      return `<tr>
<td style="padding:16px 16px 16px 0;border-top:1px solid ${LINE};font-size:14px;line-height:1.5;">
<div style="font-weight:600;color:${INK};">${esc(item.productName)}</div>
${options}
<div style="color:${GRAY};font-size:12px;">Quantity: ${item.quantity} &middot; ${esc(formatMoney(item.unitPrice, order.currency))} each</div>
</td>
<td align="right" valign="top" style="padding:16px 0;border-top:1px solid ${LINE};font-size:15px;font-weight:700;white-space:nowrap;">${esc(formatMoney(item.lineTotal, order.currency))}</td>
</tr>`;
    })
    .join("");
}

function totalsBlock(order: OrderEmailInput): string {
  const row = (label: string, value: string, strong = false) =>
    `<tr><td style="padding:4px 0;font-size:13px;color:${strong ? INK : GRAY};${strong ? "font-weight:700;font-size:15px;padding-top:10px;border-top:1px solid " + LINE + ";" : ""}">${label}</td>
<td align="right" style="padding:4px 0;font-size:13px;${strong ? "font-weight:700;font-size:16px;padding-top:10px;border-top:1px solid " + LINE + ";" : "color:" + INK + ";"}">${value}</td></tr>`;
  const rows = [
    row("Subtotal", esc(formatMoney(order.subtotal, order.currency))),
    row("Shipping", esc(formatMoney(order.shipping, order.currency))),
    row("Tax", esc(formatMoney(order.tax, order.currency))),
  ];
  if (Number(order.discount) > 0) {
    rows.push(
      row("Payment discount", `<span style="color:#1E8E5A;">-${esc(formatMoney(order.discount, order.currency))}</span>`),
    );
  }
  rows.push(row("Total", esc(formatMoney(order.total, order.currency)), true));
  return `<table role="presentation" width="260" align="right" cellpadding="0" cellspacing="0" style="width:260px;">${rows.join("")}</table>`;
}

function button(href: string, label: string, primary = true): string {
  const style = primary
    ? `background:${NAVY};color:#ffffff;border:1px solid ${NAVY};`
    : `background:#ffffff;color:${NAVY};border:1px solid ${NAVY};`;
  return `<a href="${esc(href)}" style="display:inline-block;${style}padding:11px 20px;border-radius:4px;font-size:13px;font-weight:600;text-decoration:none;margin:0 8px 8px 0;">${esc(label)}</a>`;
}

function section(title: string, content: string): string {
  return `<tr><td style="padding:8px 32px 20px;">
<div style="font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${GRAY};padding-bottom:8px;">${esc(title)}</div>
<div style="font-size:14px;line-height:1.7;color:${INK};">${content}</div></td></tr>`;
}

function paymentDetailsHtml(order: OrderEmailInput): string {
  const details = Object.entries(order.paymentDetails)
    .map(([k, v]) => `<div><span style="color:${GRAY};">${esc(k)}:</span> ${esc(v)}</div>`)
    .join("");
  return `<div style="font-weight:600;">${esc(order.paymentMethodName)}</div>${details}`;
}

export function renderCustomerEmail(order: OrderEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const firstName = order.customer.name.trim().split(/\s+/)[0] || "there";
  const subject = `We received your order ${order.orderNumber}`;

  const body = `
<tr><td style="padding:32px 32px 8px;">
<h1 style="margin:0 0 16px;font-size:26px;line-height:1.25;color:${INK};">Order received!</h1>
<p style="margin:0 0 6px;font-size:15px;font-weight:700;">Hello ${esc(firstName)},</p>
<p style="margin:0;font-size:14px;line-height:1.7;color:#333;">Thanks for shopping with pluggeo&amp;co. We&rsquo;ve received your order and our team will contact you shortly to confirm it and send your payment instructions. <strong>No payment has been taken yet.</strong></p>
</td></tr>
<tr><td style="padding:20px 32px 0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${LINE};border-bottom:1px solid ${LINE};padding-top:16px;"><tr>
${metaCell("Order date", esc(formatDate(order.issuedAt)))}
${metaCell("Order no.", esc(order.orderNumber))}
${metaCell("Payment", esc(order.paymentMethodName))}
${metaCell("Ship to", addressLines(order.customer).map(esc).join("<br>"))}
</tr></table></td></tr>
<tr><td style="padding:8px 32px 0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${itemRows(order)}</table>
</td></tr>
<tr><td style="padding:8px 32px 24px;border-top:1px solid ${LINE};margin-top:8px;">${totalsBlock(order)}<div style="clear:both;"></div></td></tr>
<tr><td style="padding:0 32px 8px;">
<p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#333;">We&rsquo;ll reach you on <strong>${esc(order.customer.phone)}</strong> (WhatsApp) or at this email address. Please keep your order number handy.</p>
<p style="margin:0 0 4px;font-size:15px;font-weight:700;">Thank you for shopping with us!</p>
<p style="margin:0 0 24px;font-size:14px;color:${GRAY};">The pluggeo&amp;co team</p>
</td></tr>`;

  const text = [
    `Hello ${firstName},`,
    "",
    "We received your order. Our team will contact you shortly to confirm it and send payment instructions. No payment has been taken yet.",
    "",
    `Order: ${order.orderNumber}`,
    `Date: ${formatDate(order.issuedAt)}`,
    `Payment method: ${order.paymentMethodName}`,
    "",
    "Items:",
    ...order.items.map((item) => {
      const opts = item.selectedOptions.length ? ` (${item.selectedOptions.join(", ")})` : "";
      return `${item.quantity} x ${item.productName}${opts} - ${formatMoney(item.lineTotal, order.currency)}`;
    }),
    "",
    `Subtotal: ${formatMoney(order.subtotal, order.currency)}`,
    `Shipping: ${formatMoney(order.shipping, order.currency)}`,
    `Tax: ${formatMoney(order.tax, order.currency)}`,
    ...(Number(order.discount) > 0
      ? [`Payment discount: -${formatMoney(order.discount, order.currency)}`]
      : []),
    `Total: ${formatMoney(order.total, order.currency)}`,
    "",
    "Ship to:",
    ...addressLines(order.customer),
    "",
    "Thank you for shopping with us!",
    "The pluggeo&co team",
  ].join("\n");

  return {
    subject,
    html: shell({
      preheader: `Order ${order.orderNumber} received - we'll be in touch to confirm.`,
      title: subject,
      body,
    }),
    text,
  };
}

export function renderOwnerEmail(order: OrderEmailInput): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `New order ${order.orderNumber} - ${formatMoney(order.total, order.currency)}`;
  const phoneDigits = order.customer.phone.replace(/\D/g, "");
  const buttons = [
    phoneDigits.length >= 7
      ? button(`https://wa.me/${phoneDigits}`, "Message on WhatsApp")
      : "",
    button(`mailto:${order.customer.email}`, "Email customer", false),
    order.paymentProofUrl ? button(order.paymentProofUrl, "View payment proof", false) : "",
  ].join("");

  const body = `
<tr><td style="padding:32px 32px 8px;">
<div style="font-size:12px;font-weight:700;letter-spacing:1px;color:${GRAY};text-transform:uppercase;">New order</div>
<h1 style="margin:6px 0 10px;font-size:28px;line-height:1.2;color:${INK};">${esc(order.orderNumber)}</h1>
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td style="font-size:20px;font-weight:700;padding-right:16px;">${esc(formatMoney(order.total, order.currency))}</td>
<td style="font-size:12px;color:${GRAY};padding-right:16px;">${esc(formatDate(order.issuedAt))}</td>
<td><span style="display:inline-block;background:#FFF4DB;color:#8A6100;font-size:11px;font-weight:700;letter-spacing:0.8px;padding:4px 10px;border-radius:99px;">AWAITING PAYMENT</span></td>
</tr></table>
<p style="margin:14px 0 0;font-size:13px;color:${GRAY};">Invoice <strong style="color:${INK};">${esc(order.invoiceNumber)}</strong> is attached as a PDF.</p>
</td></tr>
<tr><td style="padding:12px 32px 0;">
<div style="font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${GRAY};padding-bottom:4px;">Items</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${itemRows(order)}</table>
</td></tr>
<tr><td style="padding:8px 32px 24px;border-top:1px solid ${LINE};">${totalsBlock(order)}<div style="clear:both;"></div></td></tr>
${section(
  "Customer",
  `<div style="font-weight:600;">${esc(order.customer.name)}</div>
<div><a href="mailto:${esc(order.customer.email)}" style="color:${NAVY};">${esc(order.customer.email)}</a></div>
<div>${esc(order.customer.phone)}</div>`,
)}
${section("Payment", paymentDetailsHtml(order))}
${section("Ship to", addressLines(order.customer).map(esc).join("<br>"))}
<tr><td style="padding:4px 32px 28px;">${buttons}</td></tr>`;

  const text = [
    "NEW pluggeo&co ORDER",
    "",
    `Order: ${order.orderNumber}`,
    `Invoice: ${order.invoiceNumber} (PDF attached)`,
    "",
    "Customer:",
    order.customer.name,
    order.customer.email,
    order.customer.phone,
    "",
    `Payment method: ${order.paymentMethodName}`,
    ...Object.entries(order.paymentDetails).map(([k, v]) => `${k}: ${v}`),
    `Payment proof: ${order.paymentProofUrl || "Not provided"}`,
    "",
    "Shipping:",
    ...addressLines(order.customer),
    "",
    "Items:",
    ...order.items.map((item) => {
      const opts = item.selectedOptions.length ? ` (${item.selectedOptions.join(", ")})` : "";
      return `${item.quantity} x ${item.productName}${opts} | ${order.currency} ${item.unitPrice} each | ${order.currency} ${item.lineTotal}`;
    }),
    "",
    `Subtotal: ${order.currency} ${order.subtotal}`,
    `Shipping: ${order.currency} ${order.shipping}`,
    `Tax: ${order.currency} ${order.tax}`,
    `Payment discount: -${order.currency} ${order.discount}`,
    `Total: ${order.currency} ${order.total}`,
  ].join("\n");

  return {
    subject,
    html: shell({
      preheader: `${order.customer.name} placed ${order.orderNumber} for ${formatMoney(order.total, order.currency)}`,
      title: subject,
      body,
    }),
    text,
  };
}
