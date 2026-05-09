"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/lib/api";
import {
  createForgotPasswordOtpSchema,
  type ForgotPasswordOtpData,
} from "../lib/forgot-password.schemas";
import {
  clearForgotPasswordSession,
  getForgotPasswordResendSecondsRemaining,
  getPendingForgotPasswordEmail,
  isPendingForgotPasswordEmailExpired,
  startForgotPasswordResendCooldown,
} from "../lib/forgot-password-session";
import {
  useResendForgotPasswordOtp,
  useVerifyForgotPasswordOtp,
} from "../hooks/useForgotPassword";
import { getErrorCode } from "../lib/api-errors";
import { OTPInput } from "./OTPInput";
import { ResendButton } from "./ResendButton";

export function ForgotPasswordVerifyForm() {
  const t = useTranslations("auth.forgotPassword");
  const router = useRouter();
  const [email] = useState<string | null>(() => getPendingForgotPasswordEmail());
  const [stepError, setStepError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(() =>
    getForgotPasswordResendSecondsRemaining(),
  );
  const verifyOtp = useVerifyForgotPasswordOtp();
  const resendOtp = useResendForgotPasswordOtp();

  const form = useForm<ForgotPasswordOtpData>({
    resolver: zodResolver(createForgotPasswordOtpSchema(t)),
    defaultValues: { verificationCode: "" },
  });

  useEffect(() => {
    // The reset_token cookie is HttpOnly and expires after 30 min; once gone, any
    // submission would bounce. If our locally tracked expiry has passed, redirect
    // to /forgot-password proactively so the user doesn't waste an OTP.
    if (isPendingForgotPasswordEmailExpired()) {
      clearForgotPasswordSession();
      router.replace("/forgot-password");
    }
  }, [router]);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const timer = window.setTimeout(() => {
      setCooldownSeconds(getForgotPasswordResendSecondsRemaining());
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [cooldownSeconds]);

  const onSubmit = form.handleSubmit(async (data) => {
    setStepError(null);
    setResendMessage(null);

    try {
      await verifyOtp.mutateAsync({ code: data.verificationCode });
      router.push("/forgot-password/reset");
    } catch (error) {
      const code = getErrorCode(error);

      if (code === "SESSION_EXPIRED" || (error instanceof ApiError && error.status === 401)) {
        clearForgotPasswordSession();
        router.replace("/forgot-password");
        return;
      }

      if (code === "CODE_EXPIRED" || code === "MAX_ATTEMPTS_EXCEEDED") {
        clearForgotPasswordSession();
        router.replace("/forgot-password");
        return;
      }

      if (error instanceof ApiError && error.status === 429) {
        setStepError(t("errors.tryAgainLater"));
        return;
      }

      setStepError(t("errors.invalidCode"));
    }
  });

  const handleResend = () => {
    if (resendOtp.isPending || cooldownSeconds > 0) return;

    setStepError(null);
    setResendMessage(null);

    resendOtp.mutate(
      undefined,
      {
        onSuccess: () => {
          startForgotPasswordResendCooldown();
          setCooldownSeconds(getForgotPasswordResendSecondsRemaining());
          setResendMessage(t("resendSuccess"));
        },
        onError: (error) => {
          const code = getErrorCode(error);

          if (code === "SESSION_EXPIRED" || (error instanceof ApiError && error.status === 401)) {
            clearForgotPasswordSession();
            router.replace("/forgot-password");
            return;
          }

          if (error instanceof ApiError && error.status === 429) {
            setStepError(t("errors.tryAgainLater"));
            return;
          }

          setStepError(t("errors.serverError"));
        },
      },
    );
  };

  const isSubmitting = form.formState.isSubmitting || verifyOtp.isPending;

  return (
    <form onSubmit={onSubmit} className="w-full flex flex-col gap-5">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-xl font-medium text-brand-black">
          {t("verificationTitle")}
        </h1>
        <p className="text-sm text-gray-500">
          {t("verificationDescription", { email: email ?? "" })}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm text-brand-black">
          {t("verificationCodeLabel")}
        </label>
        <Controller
          control={form.control}
          name="verificationCode"
          render={({ field }) => (
            <OTPInput
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              disabled={isSubmitting}
              error={!!form.formState.errors.verificationCode}
              ariaLabel={t("verificationCodeLabel")}
            />
          )}
        />
        {form.formState.errors.verificationCode ? (
          <p className="mt-1 text-center text-xs text-red-500">
            {form.formState.errors.verificationCode.message}
          </p>
        ) : null}
      </div>

      <ResendButton
        cooldownSeconds={cooldownSeconds}
        isPending={resendOtp.isPending}
        onClick={handleResend}
        resendLabel={t("resendCode")}
        pendingLabel={t("resendingButton")}
        cooldownLabel={(seconds) => t("resendIn", { seconds })}
      />

      {resendMessage ? (
        <p className="text-center text-sm text-green-600">{resendMessage}</p>
      ) : null}

      {stepError ? (
        <p className="text-center text-sm text-red-500">{stepError}</p>
      ) : null}

      <div className="mt-1 flex gap-3">
        <button
          type="button"
          onClick={() => router.push("/forgot-password")}
          className="flex-1 rounded-full border border-brand-primary py-3.5 text-sm font-semibold text-brand-primary transition-all hover:bg-brand-primary/5"
        >
          {t("backButton")}
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 rounded-full bg-brand-primary py-3.5 text-sm font-semibold text-white transition-all hover:bg-brand-primary/90 active:scale-[0.99] disabled:opacity-50"
        >
          {isSubmitting ? t("verifyingButton") : t("verifyButton")}
        </button>
      </div>
    </form>
  );
}
