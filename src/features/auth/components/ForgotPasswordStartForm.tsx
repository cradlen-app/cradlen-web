"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import {
  createForgotPasswordStartSchema,
  type ForgotPasswordStartData,
} from "../lib/forgot-password.schemas";
import {
  setPendingForgotPasswordEmail,
  startForgotPasswordResendCooldown,
} from "../lib/forgot-password-session";
import { useStartForgotPassword } from "../hooks/useForgotPassword";

export function ForgotPasswordStartForm() {
  const t = useTranslations("auth.forgotPassword");
  const router = useRouter();
  const startForgotPassword = useStartForgotPassword();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const form = useForm<ForgotPasswordStartData>({
    resolver: zodResolver(createForgotPasswordStartSchema(t)),
  });

  const inputClass = cn(
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-brand-black",
    "placeholder:text-gray-400 outline-none transition-colors",
    "focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20",
  );

  const onSubmit = form.handleSubmit(async (data) => {
    setSuccessMessage(null);

    try {
      await startForgotPassword.mutateAsync({ email: data.email });
    } catch {
      // Swallow — silent success design prevents user enumeration.
    } finally {
      setPendingForgotPasswordEmail(data.email);
      startForgotPasswordResendCooldown();
      setSuccessMessage(t("startSuccess"));
      window.setTimeout(() => router.push("/forgot-password/verify"), 650);
    }
  });

  const isSubmitting = form.formState.isSubmitting || startForgotPassword.isPending;

  return (
    <form onSubmit={onSubmit} className="w-full flex flex-col gap-5">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-xl font-medium text-brand-black">{t("title")}</h1>
        <p className="text-sm text-gray-500">{t("description")}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm text-brand-black">
          {t("emailLabel")}
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder={t("emailPlaceholder")}
          {...form.register("email")}
          className={cn(
            inputClass,
            form.formState.errors.email &&
              "border-red-400 focus:border-red-400 focus:ring-red-400/20",
          )}
        />
        {form.formState.errors.email ? (
          <p className="mt-1 text-xs text-red-500">
            {form.formState.errors.email.message}
          </p>
        ) : null}
      </div>

      {successMessage ? (
        <p className="text-center text-sm text-green-600">{successMessage}</p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-1 w-full rounded-full bg-brand-primary py-3.5 text-sm font-semibold text-white transition-all hover:bg-brand-primary/90 active:scale-[0.99] disabled:opacity-50"
      >
        {isSubmitting ? t("sendingButton") : t("submitButton")}
      </button>

      <Link
        href="/sign-in"
        className="text-center text-sm text-brand-secondary underline underline-offset-2 transition-opacity hover:opacity-80"
      >
        {t("backToSignIn")}
      </Link>
    </form>
  );
}
