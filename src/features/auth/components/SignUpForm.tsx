"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/lib/api";
import { PasswordInput } from "./PasswordInput";
import { PhoneInput } from "./PhoneInput";
import { StepIndicator } from "./StepIndicator";
import { step1Schema } from "../lib/sign-up.schemas";
import {
  clearPendingSignupEmail,
  getPendingSignupEmail,
  setPendingSignupEmail,
} from "../lib/registration-session";
import { buildSignupStartRequest } from "../lib/signup-start";
import { getSignupResumePath } from "../lib/signup-routing";
import { useRegisterPersonal, useRegistrationStatus } from "../hooks/useSignUp";
import type { Step1Data } from "../types/sign-up.types";

export function SignUpForm() {
  const t = useTranslations("auth.signUp");
  const router = useRouter();
  const [pendingEmail] = useState<string | null>(() => getPendingSignupEmail());
  const [stepError, setStepError] = useState<string | null>(null);
  const registrationStatus = useRegistrationStatus(pendingEmail);
  const registerPersonal = useRegisterPersonal();

  const form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    mode: "onChange",
    defaultValues: {
      firstName: "",
      lastName: "",
      phoneNumber: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (!pendingEmail || !registrationStatus.data) return;

    if (registrationStatus.data.step !== "NONE") {
      const nextPath = getSignupResumePath(registrationStatus.data.step);
      clearPendingSignupEmail();
      if (registrationStatus.data.step !== "DONE") setPendingSignupEmail(pendingEmail);
      router.replace(nextPath);
      return;
    }

    clearPendingSignupEmail();
  }, [pendingEmail, registrationStatus.data, router]);

  const inputClass = cn(
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-brand-black",
    "placeholder:text-gray-400 outline-none transition-colors",
    "focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20",
  );

  const fieldError = (msg?: string) =>
    msg ? <p className="mt-1 text-xs text-red-500">{msg}</p> : null;

  const errorInputClass = (hasError: boolean) =>
    hasError ? "border-red-400 focus:border-red-400 focus:ring-red-400/20" : "";

  const handleSubmit = form.handleSubmit(async (data) => {
    setStepError(null);
    const payload = buildSignupStartRequest(data);

    try {
      await registerPersonal.mutateAsync(payload);
      setPendingSignupEmail(payload.email);
      router.push("/sign-up/verify");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setStepError(t("errors.emailAlreadyRegistered"));
      } else {
        setStepError(t("errors.serverError"));
      }
    }
  });

  if (pendingEmail && registrationStatus.isLoading) {
    return (
      <div className="w-full flex flex-col gap-7">
        <StepIndicator currentStep={1} />
        <p className="text-center text-sm text-gray-500">{t("loading")}</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-7">
      <StepIndicator currentStep={1} />

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="firstName" className="text-sm text-brand-black">
              {t("firstNameLabel")}
            </label>
            <input
              id="firstName"
              type="text"
              placeholder={t("firstNamePlaceholder")}
              {...form.register("firstName")}
              className={cn(
                inputClass,
                errorInputClass(!!form.formState.errors.firstName),
              )}
            />
            {fieldError(form.formState.errors.firstName?.message)}
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="lastName" className="text-sm text-brand-black">
              {t("lastNameLabel")}
            </label>
            <input
              id="lastName"
              type="text"
              placeholder={t("lastNamePlaceholder")}
              {...form.register("lastName")}
              className={cn(
                inputClass,
                errorInputClass(!!form.formState.errors.lastName),
              )}
            />
            {fieldError(form.formState.errors.lastName?.message)}
          </div>
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
            className={cn(inputClass, errorInputClass(!!form.formState.errors.email))}
          />
          {fieldError(form.formState.errors.email?.message)}
        </div>

        <PhoneInput
          id="phoneNumber"
          label={t("phoneLabel")}
          placeholder={t("phonePlaceholder")}
          registration={form.register("phoneNumber")}
          error={form.formState.errors.phoneNumber?.message}
          inputClassName={inputClass}
          errorInputClassName={errorInputClass(true)}
        />

        <PasswordInput
          id="password"
          label={t("passwordLabel")}
          placeholder={t("passwordPlaceholder")}
          registration={form.register("password")}
          error={form.formState.errors.password?.message}
          inputClassName={inputClass}
          errorInputClassName={errorInputClass(true)}
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
          errorInputClassName={errorInputClass(true)}
          showLabel={t("showPassword")}
          hideLabel={t("hidePassword")}
        />

        {stepError && (
          <p className="text-center text-sm text-red-500">{stepError}</p>
        )}

        <button
          type="submit"
          disabled={!form.formState.isValid || registerPersonal.isPending}
          className="mt-1 w-full rounded-full bg-brand-primary py-3.5 text-sm font-semibold text-white transition-all hover:bg-brand-primary/90 active:scale-[0.99] disabled:opacity-50"
        >
          {registerPersonal.isPending ? `${t("nextButton")}...` : t("nextButton")}
        </button>
      </form>
    </div>
  );
}
