import { z } from "zod";
import { ENGAGEMENT_TYPES, EXECUTIVE_TITLES } from "./settings.catalog";

export const profileFormSchema = z.object({
  first_name: z.string().trim().min(1).max(100),
  last_name: z.string().trim().min(1).max(100),
  phone_number: z
    .string()
    .trim()
    .max(32)
    .optional()
    .or(z.literal("")),
  /** "" → clear (sent as null). */
  executive_title: z
    .union([z.enum(EXECUTIVE_TITLES as [string, ...string[]]), z.literal("")])
    .optional(),
  engagement_type: z.enum(ENGAGEMENT_TYPES as [string, ...string[]]).optional(),
  job_function_codes: z.array(z.string()),
  specialty_codes: z.array(z.string()),
});
export type ProfileFormData = z.infer<typeof profileFormSchema>;

export const organizationFormSchema = z.object({
  name: z.string().trim().min(1).max(200),
  specialties: z.array(z.string()),
});
export type OrganizationFormData = z.infer<typeof organizationFormSchema>;

export const branchFormSchema = z.object({
  name: z.string().trim().min(1).max(200),
  address: z.string().trim().min(1),
  city: z.string().trim().min(1),
  governorate: z.string().trim().min(1),
  country: z.string().trim().optional().or(z.literal("")),
  /** undefined = leave untouched on PATCH. */
  is_main: z.boolean().optional(),
});
export type BranchFormData = z.infer<typeof branchFormSchema>;
