import { z } from "zod";

// Shared between the Server Actions (actions.ts) and the client-side form
// (src/components/admin/category-form.tsx) — see products/schema.ts's own
// comment for why this can't live inside the "use server" actions file.

export const categoryInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Lowercase letters, numbers, and hyphens only"),
  displayOrder: z.coerce.number().int("Must be a whole number"),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;
