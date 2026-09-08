import { z } from "zod";

export const checkoutItemSchema = z.object({
  id: z.string().min(1),

  quantity: z
    .number()
    .int()
    .min(1)
    .max(99),

  selectedOptions: z
    .array(z.string().trim().min(1).max(200))
    .max(50)
    .default([]),
});

export const checkoutCustomerSchema =
  z.object({
    name: z
      .string()
      .trim()
      .min(2)
      .max(100),

    email: z
      .string()
      .trim()
      .email()
      .max(255),

    phone: z
      .string()
      .trim()
      .min(5)
      .max(30),

    shippingLine1: z
      .string()
      .trim()
      .min(3)
      .max(200),

    shippingLine2: z
      .string()
      .trim()
      .max(200)
      .optional()
      .or(z.literal("")),

    city: z
      .string()
      .trim()
      .min(2)
      .max(100),

    state: z
      .string()
      .trim()
      .max(100)
      .optional()
      .or(z.literal("")),

    postalCode: z
      .string()
      .trim()
      .min(2)
      .max(20),

    country: z
      .string()
      .trim()
      .min(2)
      .max(100),
  });

export const checkoutRequestSchema =
  z.object({
    customer: checkoutCustomerSchema,

    items: z
      .array(checkoutItemSchema)
      .min(1)
      .max(50),
  });

export type CheckoutRequest = z.infer<
  typeof checkoutRequestSchema
>;