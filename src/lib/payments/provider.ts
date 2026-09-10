export type PaymentProviderName =
  | "card2crypto"
  | "allpays";

export interface PaymentCreationInput {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  customerEmail: string;
  customerName: string;
  description: string;
  returnUrl: string;
  cancelUrl: string;
  callbackUrl: string;
}

export interface PaymentCreationResult {
  providerName: PaymentProviderName;
  paymentUrl: string;
  providerPaymentId?: string;
  providerPaymentSecret?: string;
}
