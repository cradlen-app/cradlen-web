"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/lib/api";
import { StepIndicator } from "./StepIndicator";
import { step2Schema } from "../lib/sign-up.schemas";
import { useResendOtp, useVerifyEmail } from "../hooks/useSignUp";
import {
  getPendingSignupEmail,
  getPendingSignupToken,
} from "../lib/registration-session";
import type { Step2Data } from "../types/sign-up.types";

type SignUpVerifyFormContentProps = {
  email: string | null;
  signupToken: string;
};

const emptySubscribe = () => () => {};
const nullSnapshot = () => null;

export function SignUpVerifyForm() {
  const t = useTranslations("auth.signUp");
  const router = useRouter();

  const signupToken = useSyncExternalStore(
    emptySubscribe,
    getPendingSignupToken,
    nullSnapshot,
  );
  const email = useSyncExternalStore(
    emptySubscribe,
    getPendingSignupEmail,
    nullSnapshot,
  );

  useEffect(() => {
    if (!signupToken) {
      router.replace("/sign-up");
    }
  }, [signupToken, router]);

  if (!signupToken) {
    return (
      <div className="w-full flex flex-col gap-7">
        <StepIndicator currentStep={2} />
        <p className="text-center text-sm text-gray-500">{t("loading")}</p>
      </div>
    );
  }

  return <SignUpVerifyFormContent email={email} signupToken={signupToken} />;
}

function SignUpVerifyFormContent({
  email,
  signupToken,
}: SignUpVerifyFormContentProps) {
  const t = useTranslations("auth.signUp");
  const router = useRouter();
  const [stepError, setStepError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const verifyEmail = useVerifyEmail();
  const resendOtp = useResendOtp();

  const form = useForm<Step2Data>({ resolver: zodResolver(step2Schema) });

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
        signup_token: signupToken,
        code: data.verificationCode,
      });
      router.replace("/sign-up/complete");
    } catch {
      setStepError(t("errors.invalidCode"));
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
            setStepError(t("errors.tryAgainLater"));
          } else {
            setStepError(t("errors.serverError"));
          }
        },
      },
    );
  };

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
          <label htmlFor="verificationCode" className="text-sm text-brand-black">
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
            onClick={() => router.push("/sign-up")}
            className="flex-1 rounded-full border border-brand-primary py-3.5 text-sm font-semibold text-brand-primary transition-all hover:bg-brand-primary/5"
          >
            {t("backButton")}
          </button>
          <button
            type="submit"
            disabled={verifyEmail.isPending}
            className="flex-1 rounded-full bg-brand-primary py-3.5 text-sm font-semibold text-white transition-all hover:bg-brand-primary/90 active:scale-[0.99] disabled:opacity-50"
          >
            {verifyEmail.isPending ? `${t("nextButton")}...` : t("nextButton")}
          </button>
        </div>
      </form>
    </div>
  );
}
