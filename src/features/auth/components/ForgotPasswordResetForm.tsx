"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { PasswordInput } from "./PasswordInput";
import {
  createForgotPasswordResetSchema,
  type ForgotPasswordResetData,
} from "../lib/forgot-password.schemas";
import { clearForgotPasswordSession } from "../lib/forgot-password-session";
import { useResetForgotPassword } from "../hooks/useForgotPassword";

function getErrorCode(error: unknown): string | undefined {
  const body = (error instanceof ApiError ? error.body : null) as
    | { error?: { code?: string } }
    | null
    | undefined;
  return body?.error?.code;
}

export function ForgotPasswordResetForm() {
  const t = useTranslations("auth.forgotPassword");
  const router = useRouter();
  const resetPassword = useResetForgotPassword();
  const [sessionExpired, setSessionExpired] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const form = useForm<ForgotPasswordResetData>({
    resolver: zodResolver(createForgotPasswordResetSchema(t)),
  });

  const inputClass = cn(
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-brand-black",
    "placeholder:text-gray-400 outline-none transition-colors",
    "focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20",
  );
  const errorInputClass =
    "border-red-400 focus:border-red-400 focus:ring-red-400/20";

  const onSubmit = form.handleSubmit(async (data) => {
    setStepError(null);
    setSuccessMessage(null);

    try {
      await resetPassword.mutateAsync({
        password: data.password,
        confirm_password: data.confirmPassword,
      });
      clearForgotPasswordSession();
      setSuccessMessage(t("resetSuccess"));
      window.setTimeout(() => router.replace("/sign-in"), 900);
    } catch (error) {
      const code = getErrorCode(error);

      if (code === "SESSION_EXPIRED" || (error instanceof ApiError && error.status === 401)) {
        clearForgotPasswordSession();
        setSessionExpired(true);
        return;
      }

      if (
        error instanceof ApiError &&
        [400, 403, 404, 422].includes(error.status)
      ) {
        setStepError(t("errors.invalidToken"));
        return;
      }

      setStepError(t("errors.serverError"));
    }
  });

  const isSubmitting = form.formState.isSubmitting || resetPassword.isPending;

  if (sessionExpired) {
    return (
      <div className="w-full flex flex-col gap-5 text-center">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-medium text-brand-black">
            {t("resetTitle")}
          </h1>
          <p className="text-sm text-gray-500">{t("sessionExpired")}</p>
        </div>
        <Link
          href="/forgot-password"
          className="mt-1 w-full rounded-full bg-brand-primary py-3.5 text-sm font-semibold text-white transition-all hover:bg-brand-primary/90"
        >
          {t("startOverButton")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="w-full flex flex-col gap-5">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-xl font-medium text-brand-black">
          {t("resetTitle")}
        </h1>
        <p className="text-sm text-gray-500">{t("resetDescription")}</p>
      </div>

      <PasswordInput
        id="password"
        label={t("newPasswordLabel")}
        placeholder={t("newPasswordPlaceholder")}
        registration={form.register("password")}
        error={form.formState.errors.password?.message}
        inputClassName={inputClass}
        errorInputClassName={errorInputClass}
        showLabel={t("showPassword")}
        hideLabel={t("hidePassword")}
      />

      <PasswordInput
        id="confirmPassword"
        label={t("confirmPasswordLabel")}
        placeholder={t("confirmPasswordPlaceholder")}
        registration={form.register("confirmPassword")}
        error={form.formState.errors.confirmPassword?.message}
        inputClassName={inputClass}
        errorInputClassName={errorInputClass}
        showLabel={t("showPassword")}
        hideLabel={t("hidePassword")}
      />

      {successMessage ? (
        <p className="text-center text-sm text-green-600">{successMessage}</p>
      ) : null}

      {stepError ? (
        <p className="text-center text-sm text-red-500">{stepError}</p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-1 w-full rounded-full bg-brand-primary py-3.5 text-sm font-semibold text-white transition-all hover:bg-brand-primary/90 active:scale-[0.99] disabled:opacity-50"
      >
        {isSubmitting ? t("resettingButton") : t("resetButton")}
      </button>
    </form>
  );
}
