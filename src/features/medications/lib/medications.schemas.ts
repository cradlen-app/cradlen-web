import { z } from "zod";

export const medicationFormSchema = z.object({
  code: z.string().min(1, "Code is required").max(64),
  name: z.string().min(1, "Name is required").max(200),
  form: z.string().max(64).optional(),
  strength: z.string().max(64).optional(),
});

export type MedicationFormValues = z.infer<typeof medicationFormSchema>;
