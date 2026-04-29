import { z } from "zod";

const PHONE_NUMBER_REGEXES = [
  /^(?:\+20|0020|0)?1[0125]\d{8}$/,
  /^\+[1-9]\d{7,14}$/,
];

function isValidOptionalPhone(value: string | undefined) {
  const normalized = value?.replace(/[\s().-]/g, "") ?? "";

  if (!normalized) return true;

  return PHONE_NUMBER_REGEXES.some((regex) => regex.test(normalized));
}

export const step1Schema = z
  .object({
    firstName: z.string().min(1, { message: "First name is required" }),
    lastName: z.string().min(1, { message: "Last name is required" }),
    phoneNumber: z
      .string()
      .optional()
      .refine(isValidOptionalPhone, {
        message: "Enter a valid phone number",
      }),
    email: z
      .string()
      .min(1, { message: "Email is required" })
      .email({ message: "Enter a valid email address" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" })
      .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
      .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
      .regex(/[0-9]/, { message: "Password must contain at least one number" })
      .regex(/[^a-zA-Z0-9]/, { message: "Password must contain at least one symbol" }),
    confirmPassword: z
      .string()
      .min(1, { message: "Please confirm your password" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const step2Schema = z.object({
  verificationCode: z
    .string()
    .length(6, { message: "Code must be exactly 6 digits" })
    .regex(/^\d{6}$/, { message: "Code must contain only digits" }),
});

export const step3Schema = z
  .object({
    organizationName: z
      .string()
      .optional(),
    accountName: z
      .string()
      .min(1, { message: "Account name is required" }),
    specialties: z.string().min(1, { message: "Please enter at least one specialty" }),
    city: z.string().min(1, { message: "City is required" }),
    address: z.string().min(1, { message: "Address is required" }),
    governorate: z.string().min(1, { message: "Governorate is required" }),
    country: z.string().min(1, { message: "Country is required" }),
    role: z.enum(["owner", "owner_doctor"], {
      message: "Please select a role",
    }),
    specialty: z.string().optional(),
    jobTitle: z.string().optional(),
  });
