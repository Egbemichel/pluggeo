import { z } from "zod";

export const paymentMethodFieldSchema = z.object({
  key: z.string().trim().regex(/^[a-z][a-z0-9_]{0,39}$/),
  label: z.string().trim().min(1).max(100),
  required: z.boolean(),
  placeholder: z.string().max(160).optional(),
});

export const paymentMethodWalletSchema = z.object({
  id: z.string().trim().min(1).max(80),
  name: z.string().trim().min(1).max(80),
  network: z.string().trim().min(1).max(80),
  address: z.string().trim().min(1).max(256),
  asset: z.string().trim().max(80).optional(),
});

export const paymentMethodInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80),
  description: z.string().trim().max(240),
  instructions: z.string().trim().max(2000),
  enabled: z.boolean(),
  isCrypto: z.boolean(),
  requireProof: z.boolean(),
  discountPercent: z.number().min(0).max(100),
  customerFields: z.array(paymentMethodFieldSchema).max(10),
  wallets: z.array(paymentMethodWalletSchema).max(20),
  sortOrder: z.number().int().min(0).max(10000),
}).superRefine((method, context) => {
  const keys = method.customerFields.map((field) => field.key);
  if (new Set(keys).size !== keys.length) {
    context.addIssue({
      code: "custom",
      path: ["customerFields"],
      message: "Customer field keys must be unique.",
    });
  }

  const walletIds = method.wallets.map((wallet) => wallet.id);
  if (new Set(walletIds).size !== walletIds.length) {
    context.addIssue({
      code: "custom",
      path: ["wallets"],
      message: "Wallet IDs must be unique.",
    });
  }

  if (!method.isCrypto && method.discountPercent > 0) {
    context.addIssue({
      code: "custom",
      path: ["discountPercent"],
      message: "Only crypto methods can offer a discount.",
    });
  }

  if (method.isCrypto && method.wallets.length === 0) {
    context.addIssue({
      code: "custom",
      path: ["wallets"],
      message: "Add at least one wallet to enable a crypto method.",
    });
  }
});

export type PaymentMethodInput = z.infer<typeof paymentMethodInputSchema>;
