import { z } from "zod";

export const medicationFormSchema = z.object({
  code: z.string().min(1, "Code is required").max(64),
  name: z.string().min(1, "Name is required").max(200),
  genericName: z.string().max(200).optional(),
  form: z.string().max(64).optional(),
  strength: z.string().max(64).optional(),
  category: z.string().max(100).optional(),
  company: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
  defaultDoseAmount: z.string().optional(),
  defaultDoseUnit: z.string().max(32).optional(),
  defaultDoseFrequency: z.string().max(100).optional(),
  defaultDoseRoute: z.string().max(100).optional(),
});

export type MedicationFormValues = z.infer<typeof medicationFormSchema>;
