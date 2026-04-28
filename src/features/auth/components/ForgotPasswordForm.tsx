"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuthStore } from "../store/authStore";
import { step1Schema, step2Schema, step3Schema } from "../lib/forgot-password.schemas";
import {
  useSendResetCode,
  useVerifyResetCode,
  useResetPassword,
} from "../hooks/useForgotPassword";
import type { z } from "zod";

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;

export function ForgotPasswordForm() {
  const t = useTranslations("auth.forgotPassword");
  const router = useRouter();
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const sendResetCode = useSendResetCode();
  const verifyResetCode = useVerifyResetCode();
  const resetPassword = useResetPassword();

  const step1Form = useForm<Step1Data>({ resolver: zodResolver(step1Schema) });
  const step2Form = useForm<Step2Data>({ resolver: zodResolver(step2Schema) });
  const step3Form = useForm<Step3Data>({ resolver: zodResolver(step3Schema) });

  const inputClass = cn(
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-brand-black",
    "placeholder:text-gray-400 outline-none transition-colors",
    "focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20",
  );

  const errorInputClass = (hasError: boolean) =>
    hasError ? "border-red-400 focus:border-red-400 focus:ring-red-400/20" : "";

  const fieldError = (msg?: string) =>
    msg ? <p className="mt-1 text-xs text-red-500">{msg}</p> : null;

  const handleStep1Submit = step1Form.handleSubmit(async (data) => {
    setStepError(null);
    try {
      const res = await sendResetCode.mutateAsync({ email: data.email });
      setEmail(data.email);
      setResetToken(res.data.reset_token);
      setResendCooldown(60);
      setCurrentStep(2);
    } catch {
      setStepError(t("errors.serverError"));
    }
  });

  const handleStep2Submit = step2Form.handleSubmit(async (data) => {
    setStepError(null);
    setResendMessage(null);
    try {
      const res = await verifyResetCode.mutateAsync({
        reset_token: resetToken!,
        code: data.verificationCode,
      });
      setResetToken(res.data.reset_token);
      setCurrentStep(3);
    } catch {
      setStepError(t("errors.invalidCode"));
    }
  });

  const handleStep3Submit = step3Form.handleSubmit(async (data) => {
    setStepError(null);
    try {
      await resetPassword.mutateAsync({
        reset_token: resetToken!,
        password: data.password,
        confirm_password: data.confirmPassword,
      });
      setAuthenticated();
      router.replace("/");
    } catch {
      setStepError(t("errors.serverError"));
    }
  });

  const handleBack = () => {
    setStepError(null);
    setResendMessage(null);
    setCurrentStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s));
  };

  const handleResend = () => {
    setResendMessage(null);
    setStepError(null);
    sendResetCode.mutate(
      { email },
      {
        onSuccess: (res) => {
          setResetToken(res.data.reset_token);
          setResendMessage(t("errors.resendSuccess"));
          setResendCooldown(60);
        },
        onError: () => setStepError(t("errors.serverError")),
      },
    );
  };

  return (
    <div className="w-full flex flex-col gap-7">
      {/* Step 1: Email */}
      {currentStep === 1 && (
        <form onSubmit={handleStep1Submit} className="w-full flex flex-col gap-5">
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
              {...step1Form.register("email")}
              className={cn(
                inputClass,
                errorInputClass(!!step1Form.formState.errors.email),
              )}
            />
            {fieldError(step1Form.formState.errors.email?.message)}
          </div>

          {stepError && (
            <p className="text-sm text-red-500 text-center">{stepError}</p>
          )}

          <button
            type="submit"
            disabled={sendResetCode.isPending}
            className="mt-1 w-full rounded-full bg-brand-primary py-3.5 text-sm font-semibold text-white hover:bg-brand-primary/90 active:scale-[0.99] transition-all disabled:opacity-50"
          >
            {t("submitButton")}
          </button>

          <Link
            href="/sign-in"
            className="text-center text-sm text-brand-secondary underline underline-offset-2 hover:opacity-80 transition-opacity"
          >
            {t("backToSignIn")}
          </Link>
        </form>
      )}

      {/* Step 2: Verify Code */}
      {currentStep === 2 && (
        <form onSubmit={handleStep2Submit} className="w-full flex flex-col gap-5">
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-xl font-medium text-brand-black">
              {t("verificationTitle")}
            </h1>
            <p className="text-sm text-gray-500">
              {t("verificationDescription", { email })}
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
              {...step2Form.register("verificationCode")}
              className={cn(
                inputClass,
                "text-center text-xl tracking-[0.5em] font-semibold",
                errorInputClass(!!step2Form.formState.errors.verificationCode),
              )}
            />
            {fieldError(step2Form.formState.errors.verificationCode?.message)}
          </div>

          <button
            type="button"
            onClick={handleResend}
            disabled={sendResetCode.isPending || resendCooldown > 0}
            className="text-sm text-brand-secondary underline underline-offset-2 hover:opacity-80 transition-opacity text-center disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
          >
            {resendCooldown > 0
              ? t("resendIn", { seconds: resendCooldown })
              : t("resendCode")}
          </button>

          {resendMessage && (
            <p className="text-sm text-green-600 text-center">{resendMessage}</p>
          )}

          {stepError && (
            <p className="text-sm text-red-500 text-center">{stepError}</p>
          )}

          <div className="flex gap-3 mt-1">
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 rounded-full border border-brand-primary py-3.5 text-sm font-semibold text-brand-primary hover:bg-brand-primary/5 transition-all"
            >
              {t("backButton")}
            </button>
            <button
              type="submit"
              disabled={verifyResetCode.isPending}
              className="flex-1 rounded-full bg-brand-primary py-3.5 text-sm font-semibold text-white hover:bg-brand-primary/90 active:scale-[0.99] transition-all disabled:opacity-50"
            >
              {t("verifyButton")}
            </button>
          </div>
        </form>
      )}

      {/* Step 3: New Password */}
      {currentStep === 3 && (
        <form onSubmit={handleStep3Submit} className="w-full flex flex-col gap-5">
          <div className="flex flex-col gap-2 text-center">
            <h1 className="text-xl font-medium text-brand-black">{t("title")}</h1>
          </div>

          {/* New Password */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm text-brand-black">
                {t("newPasswordLabel")}
              </label>
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? (
                  <Eye className="size-3.5" />
                ) : (
                  <EyeOff className="size-3.5" />
                )}
                {showPassword ? t("hidePassword") : t("showPassword")}
              </button>
            </div>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder={t("newPasswordPlaceholder")}
              {...step3Form.register("password")}
              className={cn(
                inputClass,
                errorInputClass(!!step3Form.formState.errors.password),
              )}
            />
            {fieldError(step3Form.formState.errors.password?.message)}
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="confirmPassword" className="text-sm text-brand-black">
                {t("confirmPasswordLabel")}
              </label>
              <button
                type="button"
                onClick={() => setShowConfirmPassword((p) => !p)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showConfirmPassword ? (
                  <Eye className="size-3.5" />
                ) : (
                  <EyeOff className="size-3.5" />
                )}
                {showConfirmPassword ? t("hidePassword") : t("showPassword")}
              </button>
            </div>
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder={t("confirmPasswordPlaceholder")}
              {...step3Form.register("confirmPassword")}
              className={cn(
                inputClass,
                errorInputClass(!!step3Form.formState.errors.confirmPassword),
              )}
            />
            {fieldError(step3Form.formState.errors.confirmPassword?.message)}
          </div>

          {stepError && (
            <p className="text-sm text-red-500 text-center">{stepError}</p>
          )}

          <button
            type="submit"
            disabled={resetPassword.isPending}
            className="mt-1 w-full rounded-full bg-brand-primary py-3.5 text-sm font-semibold text-white hover:bg-brand-primary/90 active:scale-[0.99] transition-all disabled:opacity-50"
          >
            {t("resetButton")}
          </button>
        </form>
      )}
    </div>
  );
}
