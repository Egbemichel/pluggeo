export function calculateManualPaymentDiscount(
  subtotal: number,
  isCrypto: boolean,
  discountPercent: number,
): number {
  if (!isCrypto || !Number.isFinite(subtotal) || subtotal <= 0) return 0;
  if (!Number.isFinite(discountPercent)) return 0;

  const boundedPercent = Math.min(100, Math.max(0, discountPercent));
  return Math.min(subtotal, Math.round(subtotal * boundedPercent) / 100);
}
