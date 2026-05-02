import { useTranslations } from "next-intl";
import { z } from "zod";

type ForgotPasswordTranslations = ReturnType<
  typeof useTranslations<"auth.forgotPassword">
>;

export function createForgotPasswordStartSchema(t: ForgotPasswordTranslations) {
  return z.object({
    email: z
      .string()
      .min(1, { message: t("errors.emailRequired") })
      .email({ message: t("errors.emailInvalid") }),
  });
}

export function createForgotPasswordOtpSchema(t: ForgotPasswordTranslations) {
  return z.object({
    verificationCode: z
      .string()
      .length(6, { message: t("errors.codeLength") })
      .regex(/^\d{6}$/, { message: t("errors.codeDigits") }),
  });
}

export function createForgotPasswordResetSchema(t: ForgotPasswordTranslations) {
  return z
    .object({
      password: z
        .string()
        .min(8, { message: t("errors.passwordMinLength") })
        .max(128, { message: t("errors.passwordMaxLength") })
        .regex(/[A-Z]/, { message: t("errors.passwordUppercase") })
        .regex(/[a-z]/, { message: t("errors.passwordLowercase") })
        .regex(/[0-9]/, { message: t("errors.passwordDigit") })
        .regex(/[^A-Za-z0-9]/, { message: t("errors.passwordSpecial") }),
      confirmPassword: z
        .string()
        .min(1, { message: t("errors.confirmPasswordRequired") }),
    })
    .superRefine((val, ctx) => {
      if (val.password !== val.confirmPassword) {
        ctx.addIssue({
          code: "custom",
          path: ["confirmPassword"],
          message: t("errors.passwordMismatch"),
        });
      }
    });
}

export type ForgotPasswordStartData = z.infer<
  ReturnType<typeof createForgotPasswordStartSchema>
>;

export type ForgotPasswordOtpData = z.infer<
  ReturnType<typeof createForgotPasswordOtpSchema>
>;

export type ForgotPasswordResetData = z.infer<
  ReturnType<typeof createForgotPasswordResetSchema>
>;
