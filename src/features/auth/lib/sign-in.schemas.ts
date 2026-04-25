import { useTranslations } from "next-intl";
import z from "zod";

export const createSignInSchema = (
  t: ReturnType<typeof useTranslations<"auth.signIn">>,
) =>
  z.object({
    email: z
      .string()
      .min(1, t("errors.emailRequired"))
      .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, t("errors.emailInvalid")),
    password: z
      .string()
      .min(1, t("errors.passwordRequired"))
      .min(8, t("errors.passwordMinLength")),
  });

export type SignInFormData = z.infer<ReturnType<typeof createSignInSchema>>;
