import { z } from "zod";

export const step1Schema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Enter a valid email address" }),
});

export const step2Schema = z.object({
  verificationCode: z
    .string()
    .length(6, { message: "Code must be exactly 6 digits" })
    .regex(/^\d{6}$/, { message: "Code must contain only digits" }),
});

export const step3Schema = z
  .object({
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" }),
    confirmPassword: z
      .string()
      .min(1, { message: "Please confirm your password" }),
  })
  .superRefine((val, ctx) => {
    if (val.password !== val.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }
  });
