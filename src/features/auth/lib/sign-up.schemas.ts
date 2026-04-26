import { z } from "zod";

export const step1Schema = z
  .object({
    firstName: z.string().min(1, { message: "First name is required" }),
    lastName: z.string().min(1, { message: "Last name is required" }),
    phone: z.string().min(1, { message: "Phone number is required" }),
    email: z
      .string()
      .min(1, { message: "Email is required" })
      .email({ message: "Enter a valid email address" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" }),
    confirmPassword: z
      .string()
      .min(1, { message: "Please confirm your password" }),
    isClinical: z.boolean(),
    specialty: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.password !== val.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }
    if (val.isClinical && !val.specialty) {
      ctx.addIssue({
        code: "custom",
        path: ["specialty"],
        message: "Please select your specialty",
      });
    }
  });

export const step2Schema = z.object({
  verificationCode: z
    .string()
    .length(6, { message: "Code must be exactly 6 digits" })
    .regex(/^\d{6}$/, { message: "Code must contain only digits" }),
});

export const step3Schema = z.object({
  organizationName: z
    .string()
    .min(1, { message: "Organization name is required" }),
  specialties: z.string().min(1, { message: "Please enter at least one specialty" }),
  city: z.string().min(1, { message: "City is required" }),
  address: z.string().min(1, { message: "Address is required" }),
  governorate: z.string().min(1, { message: "Governorate is required" }),
  country: z.string().min(1, { message: "Country is required" }),
});
