"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/lib/api";
import { StepIndicator } from "./StepIndicator";
import { makeStep2Schema } from "../lib/sign-up.schemas";
import {
  useResendOtp,
  useVerifyEmail,
  useRegistrationStatus,
} from "../hooks/useSignUp";
import {
  clearPendingSignupSession,
  getPendingSignupEmail,
} from "../lib/registration-session";
import type { Step2Data } from "../types/sign-up.types";

type SignUpVerifyFormContentProps = {
  email: string | null;
};

const emptySubscribe = () => () => {};
const nullSnapshot = () => null;

function getErrorCode(err: unknown): string | null {
  if (!(err instanceof ApiError)) return null;
  const error = (err.body as Record<string, unknown>)?.error;
  if (!error || typeof error !== "object") return null;
  const code = (error as Record<string, unknown>).code;
  return typeof code === "string" ? code : null;
}

export function SignUpVerifyForm() {
  const t = useTranslations("auth.signUp");
  const router = useRouter();

  // Read non-sensitive pending email synchronously on the client.
  const email = useSyncExternalStore(
    emptySubscribe,
    getPendingSignupEmail,
    nullSnapshot,
  );

  // The signup token is kept in an HttpOnly cookie. Check registration status
  // so we can render the form and let the server route use its cookie.
  const shouldCheckStatus = !!email;
  const statusQuery = useRegistrationStatus(shouldCheckStatus ? email : null);

  const statusStep = statusQuery.data?.step;
  const statusError = statusQuery.error;
  const statusLoading = statusQuery.isLoading;

  useEffect(() => {
    // No session at all — go back to start.
    if (!email) {
      router.replace("/sign-up");
      return;
    }

    // Still waiting for the status response.
    if (!shouldCheckStatus || statusLoading) return;

    if (statusError) {
      clearPendingSignupSession();
      router.replace("/sign-up");
      return;
    }

    if (statusStep === "COMPLETE_ONBOARDING") {
      router.replace("/sign-up/complete");
      return;
    }

    if (statusStep === "DONE" || statusStep === "NONE" || !statusStep) {
      clearPendingSignupSession();
      router.replace("/sign-up");
    }
    // statusStep === "VERIFY_OTP": stay here, shouldShowForm becomes true.
  }, [
    email,
    shouldCheckStatus,
    statusLoading,
    statusStep,
    statusError,
    router,
  ]);

  const isLoading = shouldCheckStatus && statusLoading;
  const shouldShowForm = shouldCheckStatus && statusStep === "VERIFY_OTP";

  if (isLoading || !shouldShowForm) {
    return (
      <div className="w-full flex flex-col gap-7">
        <StepIndicator currentStep={2} />
        <p className="text-center text-sm text-gray-500">{t("loading")}</p>
      </div>
    );
  }

  return <SignUpVerifyFormContent email={email} />;
}

function SignUpVerifyFormContent({
  email,
}: SignUpVerifyFormContentProps) {
  const t = useTranslations("auth.signUp");
  const router = useRouter();
  const [stepError, setStepError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const verifyEmail = useVerifyEmail();
  const resendOtp = useResendOtp();

  const handleStartOver = () => {
    clearPendingSignupSession();
    router.replace("/sign-up");
  };

  const schema = useMemo(() => makeStep2Schema(t), [t]);
  const form = useForm<Step2Data>({
    resolver: zodResolver(schema),
    mode: "onChange",
  });

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const inputClass = cn(
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-brand-black",
    "placeholder:text-gray-400 outline-none transition-colors",
    "focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20",
  );

  const errorInputClass = (hasError: boolean) =>
    hasError ? "border-red-400 focus:border-red-400 focus:ring-red-400/20" : "";

  const fieldError = (msg?: string) =>
    msg ? <p className="mt-1 text-xs text-red-500">{msg}</p> : null;

  const handleSubmit = form.handleSubmit(async (data) => {
    setStepError(null);
    setResendMessage(null);
    try {
      await verifyEmail.mutateAsync({
        code: data.verificationCode,
      });
      router.replace("/sign-up/complete");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setIsSessionExpired(true);
      } else if (err instanceof ApiError && err.status === 400) {
        const code = getErrorCode(err);
        if (code === "CODE_EXPIRED") {
          setStepError(t("errors.otpExpired"));
        } else if (code === "MAX_ATTEMPTS_EXCEEDED") {
          setStepError(t("errors.otpLocked"));
        } else {
          setStepError(t("errors.invalidCode"));
        }
      } else {
        setStepError(t("errors.serverError"));
      }
    }
  });

  const handleResend = () => {
    if (!email || resendCooldown > 0 || resendOtp.isPending) return;

    setStepError(null);
    setResendMessage(null);
    resendOtp.mutate(
      { email },
      {
        onSuccess: () => {
          setResendMessage(t("errors.resendSuccess"));
          setResendCooldown(60);
        },
        onError: (err) => {
          if (err instanceof ApiError && err.status === 429) {
            const code = getErrorCode(err);
            if (code === "RESEND_LIMIT_EXCEEDED") {
              setStepError(t("errors.resendLocked"));
            } else {
              setStepError(t("errors.tryAgainLater"));
            }
          } else {
            setStepError(t("errors.serverError"));
          }
        },
      },
    );
  };

  if (isSessionExpired) {
    return (
      <div className="w-full flex flex-col gap-7">
        <StepIndicator currentStep={2} />
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium text-red-500">
              {t("errors.sessionExpired")}
            </p>
            <p className="text-sm text-gray-500">
              {t("errors.sessionExpiredDetail")}
            </p>
          </div>
          <button
            type="button"
            onClick={handleStartOver}
            className="w-full rounded-full bg-brand-primary py-3.5 text-sm font-semibold text-white transition-all hover:bg-brand-primary/90 active:scale-[0.99]"
          >
            {t("errors.startOver")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-7">
      <StepIndicator currentStep={2} />

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
        <div className="flex flex-col gap-2 text-center">
          <h2 className="text-lg font-semibold text-brand-black">
            {t("verificationTitle")}
          </h2>
          <p className="text-sm text-gray-500">
            {t("verificationDescription", { email: email ?? "" })}
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="verificationCode"
            className="text-sm text-brand-black"
          >
            {t("verificationCodeLabel")}
          </label>
          <input
            id="verificationCode"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder={t("verificationCodePlaceholder")}
            {...form.register("verificationCode")}
            className={cn(
              inputClass,
              "text-center text-xl font-semibold tracking-[0.5em]",
              errorInputClass(!!form.formState.errors.verificationCode),
            )}
          />
          {fieldError(form.formState.errors.verificationCode?.message)}
        </div>

        <button
          type="button"
          onClick={handleResend}
          disabled={resendOtp.isPending || resendCooldown > 0}
          className="text-center text-sm text-brand-secondary underline underline-offset-2 transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50 disabled:no-underline"
        >
          {resendCooldown > 0
            ? t("resendIn", { seconds: resendCooldown })
            : t("resendCode")}
        </button>

        {resendMessage && (
          <p className="text-center text-sm text-green-600">{resendMessage}</p>
        )}

        {stepError && (
          <p className="text-center text-sm text-red-500">{stepError}</p>
        )}

        <div className="flex gap-3 mt-1">
          <button
            type="button"
            onClick={handleStartOver}
            className="flex-1 rounded-full border border-brand-primary py-3.5 text-sm font-semibold text-brand-primary transition-all hover:bg-brand-primary/5"
          >
            {t("backButton")}
          </button>
          <button
            type="submit"
            disabled={!form.formState.isValid || verifyEmail.isPending}
            className="flex-1 rounded-full bg-brand-primary py-3.5 text-sm font-semibold text-white transition-all hover:bg-brand-primary/90 active:scale-[0.99] disabled:opacity-50"
          >
            {verifyEmail.isPending ? `${t("nextButton")}...` : t("nextButton")}
          </button>
        </div>
      </form>
    </div>
  );
}
