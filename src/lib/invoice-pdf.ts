import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

import {
  addressLines,
  formatDate,
  formatMoney,
  type OrderEmailInput,
} from "@/lib/order-types";

const NAVY = rgb(0.078, 0.106, 0.204);
const GRAY = rgb(0.447, 0.447, 0.447);
const LIGHT = rgb(0.949, 0.953, 0.965);
const WHITE = rgb(1, 1, 1);
const INK = rgb(0.07, 0.07, 0.09);

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 44;

// The standard PDF fonts only cover WinAnsi; anything else would throw.
function safe(text: string): string {
  return text.replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");
}

function truncate(font: PDFFont, text: string, size: number, maxWidth: number) {
  let value = safe(text);
  if (font.widthOfTextAtSize(value, size) <= maxWidth) return value;
  while (value.length > 1 && font.widthOfTextAtSize(`${value}...`, size) > maxWidth) {
    value = value.slice(0, -1);
  }
  return `${value}...`;
}

function wrap(font: PDFFont, text: string, size: number, maxWidth: number) {
  const lines: string[] = [];
  let current = "";
  for (const word of safe(text).split(/\s+/)) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function generateInvoicePdf(order: OrderEmailInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Invoice ${order.invoiceNumber}`);
  pdf.setAuthor("pluggeo&co");
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const money = (value: string | number) => safe(formatMoney(value, order.currency));
  const right = (
    page: PDFPage,
    text: string,
    x: number,
    y: number,
    size: number,
    font: PDFFont,
    color = INK,
  ) => {
    const value = safe(text);
    page.drawText(value, {
      x: x - font.widthOfTextAtSize(value, size),
      y,
      size,
      font,
      color,
    });
  };

  const page = pdf.addPage([PAGE_W, PAGE_H]);

  // Header band
  page.drawRectangle({ x: 0, y: PAGE_H - 210, width: PAGE_W, height: 210, color: NAVY });
  page.drawText("pluggeo&co", { x: MARGIN, y: PAGE_H - 62, size: 22, font: bold, color: WHITE });
  page.drawText("INVOICE", { x: MARGIN, y: PAGE_H - 128, size: 40, font: bold, color: WHITE });
  page.drawText(safe(`# ${order.invoiceNumber}`), {
    x: MARGIN,
    y: PAGE_H - 152,
    size: 11,
    font: regular,
    color: WHITE,
  });
  page.drawText(safe(`Order ${order.orderNumber}`), {
    x: MARGIN,
    y: PAGE_H - 170,
    size: 9,
    font: regular,
    color: rgb(0.78, 0.8, 0.86),
  });

  const colX = 340;
  let hy = PAGE_H - 52;
  page.drawText("Date issued", { x: colX, y: hy, size: 11, font: bold, color: WHITE });
  page.drawText(formatDate(order.issuedAt), { x: colX, y: hy - 15, size: 10, font: regular, color: WHITE });
  hy -= 44;
  page.drawText("Invoice to", { x: colX, y: hy, size: 11, font: bold, color: WHITE });
  hy -= 15;
  const billTo = [order.customer.name, order.customer.email, order.customer.phone, ...addressLines(order.customer)];
  for (const line of billTo.slice(0, 6)) {
    page.drawText(truncate(regular, line, 9.5, PAGE_W - MARGIN - colX), {
      x: colX,
      y: hy,
      size: 9.5,
      font: regular,
      color: WHITE,
    });
    hy -= 13;
  }

  // Table
  const colItem = MARGIN + 12;
  const colPrice = 380;
  const colQty = 440;
  const colTotal = PAGE_W - MARGIN - 12;
  const tableHeader = (target: PDFPage, y: number) => {
    target.drawRectangle({ x: MARGIN, y: y - 8, width: PAGE_W - MARGIN * 2, height: 28, color: LIGHT });
    target.drawText("ITEM", { x: colItem, y, size: 9, font: bold, color: NAVY });
    right(target, "PRICE", colPrice + 20, y, 9, bold, NAVY);
    right(target, "QTY", colQty + 20, y, 9, bold, NAVY);
    right(target, "TOTAL", colTotal, y, 9, bold, NAVY);
  };

  let current = page;
  let y = PAGE_H - 252;
  tableHeader(current, y);
  y -= 34;

  order.items.forEach((item, index) => {
    const nameLines = wrap(bold, item.productName, 10, colPrice - colItem - 50).slice(0, 2);
    const options = item.selectedOptions.length
      ? wrap(regular, item.selectedOptions.join(", "), 8.5, colPrice - colItem - 50).slice(0, 2)
      : [];
    const rowHeight = 14 * nameLines.length + 11 * options.length + 16;

    if (y - rowHeight < 200) {
      current = pdf.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN - 10;
      tableHeader(current, y);
      y -= 34;
    }

    if (index % 2 === 0) {
      current.drawRectangle({
        x: MARGIN,
        y: y - rowHeight + 18,
        width: PAGE_W - MARGIN * 2,
        height: rowHeight,
        color: rgb(0.975, 0.977, 0.984),
      });
    }

    let ty = y;
    for (const line of nameLines) {
      current.drawText(line, { x: colItem, y: ty, size: 10, font: bold, color: INK });
      ty -= 14;
    }
    for (const line of options) {
      current.drawText(line, { x: colItem, y: ty + 2, size: 8.5, font: regular, color: GRAY });
      ty -= 11;
    }
    right(current, money(item.unitPrice), colPrice + 20, y, 9.5, regular);
    right(current, String(item.quantity), colQty + 20, y, 9.5, regular);
    right(current, money(item.lineTotal), colTotal, y, 9.5, bold);
    y -= rowHeight;
  });

  // Totals (keep together; start a new page if there isn't room)
  if (y < 250) {
    current = pdf.addPage([PAGE_W, PAGE_H]);
    y = PAGE_H - MARGIN - 10;
  }
  y -= 36;
  const totalsTop = y;
  const totalsLeft = 340;
  const totalRows: Array<[string, string]> = [
    ["Subtotal", money(order.subtotal)],
    ["Shipping", money(order.shipping)],
    ["Tax", money(order.tax)],
  ];
  if (Number(order.discount) > 0) totalRows.push(["Payment discount", `-${money(order.discount)}`]);
  for (const [label, value] of totalRows) {
    current.drawText(label, { x: totalsLeft, y, size: 10, font: bold, color: INK });
    right(current, value, colTotal, y, 10, regular);
    y -= 20;
  }
  y -= 10;
  current.drawRectangle({
    x: totalsLeft - 12,
    y: y - 14,
    width: PAGE_W - MARGIN - totalsLeft + 12,
    height: 34,
    color: NAVY,
  });
  current.drawText("Total", { x: totalsLeft, y: y - 2, size: 12, font: bold, color: WHITE });
  right(current, money(order.total), colTotal, y - 2, 13, bold, WHITE);

  // Left column: thanks + payment method
  let ly = totalsTop;
  current.drawText("Thank you for your order", { x: MARGIN, y: ly, size: 13, font: bold, color: INK });
  ly -= 30;
  current.drawText("PAYMENT METHOD", { x: MARGIN, y: ly, size: 9, font: bold, color: NAVY });
  ly -= 14;
  current.drawText(safe(order.paymentMethodName), { x: MARGIN, y: ly, size: 10, font: regular, color: INK });
  ly -= 14;
  for (const [key, value] of Object.entries(order.paymentDetails).slice(0, 4)) {
    current.drawText(truncate(regular, `${key}: ${value}`, 9, 250), {
      x: MARGIN,
      y: ly,
      size: 9,
      font: regular,
      color: GRAY,
    });
    ly -= 12;
  }

  // Terms
  const termsY = Math.min(y - 80, ly - 30, 150);
  current.drawText("TERMS & CONDITIONS", { x: MARGIN, y: termsY, size: 9, font: bold, color: NAVY });
  const terms =
    "This invoice records an order placed on pluggeoandco.shop. No payment has been taken online. " +
    "The store will contact the customer to confirm the order and share payment instructions.";
  wrap(regular, terms, 8.5, PAGE_W - MARGIN * 2).forEach((line, i) => {
    current.drawText(line, { x: MARGIN, y: termsY - 14 - i * 11, size: 8.5, font: regular, color: GRAY });
  });

  return pdf.save();
}
