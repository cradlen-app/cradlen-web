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

export function makeStep1Schema(t: (key: string) => string = (k) => k) {
  return z
    .object({
      firstName: z.string().min(1, { message: t("errors.firstNameRequired") }),
      lastName: z.string().min(1, { message: t("errors.lastNameRequired") }),
      phoneNumber: z
        .string()
        .optional()
        .refine(isValidOptionalPhone, { message: t("errors.invalidPhone") }),
      email: z
        .string()
        .min(1, { message: t("errors.emailRequired") })
        .email({ message: t("errors.emailInvalid") }),
      password: z
        .string()
        .min(8, { message: t("errors.passwordMinLength") })
        .regex(/[a-z]/, { message: t("errors.passwordLowercase") })
        .regex(/[A-Z]/, { message: t("errors.passwordUppercase") })
        .regex(/[0-9]/, { message: t("errors.passwordNumber") })
        .regex(/[^a-zA-Z0-9]/, { message: t("errors.passwordSymbol") }),
      confirmPassword: z
        .string()
        .min(1, { message: t("errors.confirmPasswordRequired") }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("errors.passwordMismatch"),
      path: ["confirmPassword"],
    });
}

export function makeStep2Schema(t: (key: string) => string = (k) => k) {
  return z.object({
    verificationCode: z
      .string()
      .length(6, { message: t("errors.codeLength") })
      .regex(/^\d{6}$/, { message: t("errors.codeDigits") }),
  });
}

export function makeStep3Schema(t: (key: string) => string = (k) => k) {
  return z.object({
    accountName: z
      .string()
      .min(1, { message: t("errors.accountNameRequired") }),
    specialties: z
      .array(z.string())
      .min(1, { message: t("errors.specialtiesRequired") }),
    branchName: z
      .string()
      .min(1, { message: t("errors.branchNameRequired") }),
    city: z.string().min(1, { message: t("errors.cityRequired") }),
    address: z.string().min(1, { message: t("errors.addressRequired") }),
    governorate: z
      .string()
      .min(1, { message: t("errors.governorateRequired") }),
    country: z.string().optional(),
    isClinical: z.boolean(),
    specialty: z.string().optional(),
    jobTitle: z.string().optional(),
  });
}

// Convenience exports — use makeStepNSchema(t) in components for translated messages.
export const step1Schema = makeStep1Schema();
export const step2Schema = makeStep2Schema();
export const step3Schema = makeStep3Schema();
