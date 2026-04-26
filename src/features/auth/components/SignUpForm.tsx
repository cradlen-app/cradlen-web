"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/lib/api";
import { useAuthStore } from "../store/authStore";
import { StepIndicator } from "./StepIndicator";
import { step1Schema, step2Schema, step3Schema } from "../lib/sign-up.schemas";
import {
  useRegisterPersonal,
  useVerifyEmail,
  useRegisterOrganization,
  useResendOtp,
  useResumeRegistration,
} from "../hooks/useSignUp";
import type { Step1Data, Step2Data, Step3Data } from "../types/sign-up.types";
import type { AuthTokens } from "../types/sign-in.types";

const SPECIALTIES = [
  "General Practice",
  "Pediatrics",
  "Cardiology",
  "Dermatology",
  "Neurology",
  "Orthopedics",
  "Oncology",
  "Psychiatry",
  "Ophthalmology",
  "Gynecology",
];

export function SignUpForm() {
  const t = useTranslations("auth.signUp");
  const router = useRouter();
  const setTokens = useAuthStore((s) => s.setTokens);
  const searchParams = useSearchParams();

  const resumeToken = searchParams.get("token");
  const resumeStep = searchParams.get("step");

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(() => {
    if (resumeToken && (resumeStep === "2" || resumeStep === "3")) {
      return Number(resumeStep) as 2 | 3;
    }
    return 1;
  });
  const [registrationToken, setRegistrationToken] = useState<string | null>(
    resumeToken ?? null,
  );
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (currentStep === 2) setResendCooldown(60);
  }, [currentStep]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const registerPersonal = useRegisterPersonal();
  const verifyEmail = useVerifyEmail();
  const registerOrganization = useRegisterOrganization();
  const resendOtp = useResendOtp();
  const resumeRegistration = useResumeRegistration();

  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: { isClinical: false },
  });
  const step2Form = useForm<Step2Data>({ resolver: zodResolver(step2Schema) });
  const step3Form = useForm<Step3Data>({ resolver: zodResolver(step3Schema) });

  const isClinical = step1Form.watch("isClinical");

  const inputClass = cn(
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-brand-black",
    "placeholder:text-gray-400 outline-none transition-colors",
    "focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20",
  );

  const handleStep1Submit = step1Form.handleSubmit(async (data) => {
    setStepError(null);
    try {
      const res = await registerPersonal.mutateAsync({
        first_name: data.firstName,
        last_name: data.lastName,
        phone_number: data.phone,
        email: data.email,
        password: data.password,
        confirm_password: data.confirmPassword,
        is_clinical: data.isClinical,
        ...(data.isClinical && data.specialty ? { speciality: data.specialty } : {}),
      });
      setRegistrationToken(res.data.registration_token);
      setCurrentStep(2);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        // Email already exists — attempt login to detect and resume incomplete registration
        try {
          const loginRes = await resumeRegistration.mutateAsync({
            email: data.email,
            password: data.password,
          });
          const loginData = loginRes.data;
          if ("pending_step" in loginData) {
            toast.info(t("toasts.resumingRegistration"));
            setRegistrationToken(loginData.registration_token);
            setCurrentStep(loginData.pending_step === "verify_email" ? 2 : 3);
          } else {
            // Registration was already completed — log them in directly
            toast.info(t("toasts.alreadyRegistered"));
            setTokens(loginData as AuthTokens);
            router.push("/");
          }
        } catch {
          setStepError(t("errors.emailAlreadyRegistered"));
        }
      } else {
        setStepError(t("errors.serverError"));
      }
    }
  });

  const handleStep2Submit = step2Form.handleSubmit(async (data) => {
    setStepError(null);
    setResendMessage(null);
    try {
      const res = await verifyEmail.mutateAsync({
        registration_token: registrationToken!,
        code: data.verificationCode,
      });
      setRegistrationToken(res.data.registration_token);
      setCurrentStep(3);
    } catch {
      setStepError(t("errors.invalidCode"));
    }
  });

  const handleStep3Submit = step3Form.handleSubmit(async (data) => {
    setStepError(null);
    const specialtiesArray = data.specialties
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      const res = await registerOrganization.mutateAsync({
        registration_token: registrationToken!,
        organization_name: data.organizationName,
        organization_specialities: specialtiesArray,
        branch_address: data.address,
        branch_city: data.city,
        branch_governorate: data.governorate,
      });
      setTokens(res.data);
      router.push("/");
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
    if (!registrationToken) return;
    setResendMessage(null);
    setStepError(null);
    resendOtp.mutate(
      { registration_token: registrationToken },
      {
        onSuccess: (res) => {
          setRegistrationToken(res.data.registration_token);
          setResendMessage(t("errors.resendSuccess"));
          setResendCooldown(60);
        },
        onError: () => setStepError(t("errors.serverError")),
      },
    );
  };

  const fieldError = (msg?: string) =>
    msg ? <p className="mt-1 text-xs text-red-500">{msg}</p> : null;

  const errorInputClass = (hasError: boolean) =>
    hasError ? "border-red-400 focus:border-red-400 focus:ring-red-400/20" : "";

  return (
    <div className="w-full flex flex-col gap-7">
      <StepIndicator currentStep={currentStep} />

      {/* Step 1: Personal Information */}
      {currentStep === 1 && (
        <form
          onSubmit={handleStep1Submit}
          className="w-full flex flex-col gap-5"
        >
          {/* First name + Last name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="firstName" className="text-sm text-brand-black">
                {t("firstNameLabel")}
              </label>
              <input
                id="firstName"
                type="text"
                placeholder={t("firstNamePlaceholder")}
                {...step1Form.register("firstName")}
                className={cn(
                  inputClass,
                  errorInputClass(!!step1Form.formState.errors.firstName),
                )}
              />
              {fieldError(step1Form.formState.errors.firstName?.message)}
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="lastName" className="text-sm text-brand-black">
                {t("lastNameLabel")}
              </label>
              <input
                id="lastName"
                type="text"
                placeholder={t("lastNamePlaceholder")}
                {...step1Form.register("lastName")}
                className={cn(
                  inputClass,
                  errorInputClass(!!step1Form.formState.errors.lastName),
                )}
              />
              {fieldError(step1Form.formState.errors.lastName?.message)}
            </div>
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="phone" className="text-sm text-brand-black">
              {t("phoneLabel")}
            </label>
            <input
              id="phone"
              type="tel"
              placeholder={t("phonePlaceholder")}
              {...step1Form.register("phone")}
              className={cn(
                inputClass,
                errorInputClass(!!step1Form.formState.errors.phone),
              )}
            />
            {fieldError(step1Form.formState.errors.phone?.message)}
          </div>

          {/* Email */}
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

          {/* Password + Confirm password */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm text-brand-black">
                  {t("passwordLabel")}
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
                placeholder={t("passwordPlaceholder")}
                {...step1Form.register("password")}
                className={cn(
                  inputClass,
                  errorInputClass(!!step1Form.formState.errors.password),
                )}
              />
              {fieldError(step1Form.formState.errors.password?.message)}
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="confirmPassword"
                  className="text-sm text-brand-black"
                >
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
                {...step1Form.register("confirmPassword")}
                className={cn(
                  inputClass,
                  errorInputClass(!!step1Form.formState.errors.confirmPassword),
                )}
              />
              {fieldError(step1Form.formState.errors.confirmPassword?.message)}
            </div>
          </div>

          {/* Is clinical checkbox */}
          <div className="flex items-center gap-2.5">
            <input
              id="isClinical"
              type="checkbox"
              {...step1Form.register("isClinical")}
              className="size-4 rounded border-gray-300 accent-brand-primary cursor-pointer"
            />
            <label
              htmlFor="isClinical"
              className="text-sm text-brand-black cursor-pointer select-none"
            >
              {t("isClinicalLabel")}
            </label>
          </div>

          {/* Specialty (conditional) */}
          {isClinical && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="specialty" className="text-sm text-brand-black">
                {t("specialtyLabel")}
              </label>
              <div className="relative">
                <select
                  id="specialty"
                  {...step1Form.register("specialty")}
                  className={cn(
                    inputClass,
                    "appearance-none cursor-pointer",
                    errorInputClass(!!step1Form.formState.errors.specialty),
                  )}
                >
                  <option value="">{t("specialtyPlaceholder")}</option>
                  {SPECIALTIES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute inset-y-0 inset-e-3 my-auto size-4 text-gray-400" />
              </div>
              {fieldError(step1Form.formState.errors.specialty?.message)}
            </div>
          )}

          {stepError && (
            <p className="text-sm text-red-500 text-center">{stepError}</p>
          )}

          <button
            type="submit"
            disabled={registerPersonal.isPending || resumeRegistration.isPending}
            className="mt-1 w-full rounded-full bg-brand-primary py-3.5 text-sm font-semibold text-white hover:bg-brand-primary/90 active:scale-[0.99] transition-all disabled:opacity-50"
          >
            {(registerPersonal.isPending || resumeRegistration.isPending) ? t("nextButton") + "..." : t("nextButton")}
          </button>
        </form>
      )}

      {/* Step 2: Email Verification */}
      {currentStep === 2 && (
        <form
          onSubmit={handleStep2Submit}
          className="w-full flex flex-col gap-5"
        >
          <div className="flex flex-col gap-2 text-center">
            <h2 className="text-lg font-semibold text-brand-black">
              {t("verificationTitle")}
            </h2>
            <p className="text-sm text-gray-500">
              {t("verificationDescription")}
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
            disabled={resendOtp.isPending || resendCooldown > 0}
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
              disabled={verifyEmail.isPending}
              className="flex-1 rounded-full bg-brand-primary py-3.5 text-sm font-semibold text-white hover:bg-brand-primary/90 active:scale-[0.99] transition-all disabled:opacity-50"
            >
              {t("nextButton")}
            </button>
          </div>
        </form>
      )}

      {/* Step 3: Organization Information */}
      {currentStep === 3 && (
        <form
          onSubmit={handleStep3Submit}
          className="w-full flex flex-col gap-5"
        >
          {/* Organization name */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="organizationName"
              className="text-sm text-brand-black"
            >
              {t("organizationNameLabel")}
            </label>
            <input
              id="organizationName"
              type="text"
              placeholder={t("organizationNamePlaceholder")}
              {...step3Form.register("organizationName")}
              className={cn(
                inputClass,
                errorInputClass(!!step3Form.formState.errors.organizationName),
              )}
            />
            {fieldError(step3Form.formState.errors.organizationName?.message)}
          </div>

          {/* Specialties */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="specialties" className="text-sm text-brand-black">
              {t("specialtiesLabel")}
            </label>
            <input
              id="specialties"
              type="text"
              placeholder={t("specialtiesPlaceholder")}
              {...step3Form.register("specialties")}
              className={cn(
                inputClass,
                errorInputClass(!!step3Form.formState.errors.specialties),
              )}
            />
            {fieldError(step3Form.formState.errors.specialties?.message)}
          </div>

          {/* Main branch section */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-medium text-brand-black border-b border-gray-100 pb-2">
              {t("mainBranchHeading")}
            </h3>

            {/* Country */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="country" className="text-sm text-brand-black">
                {t("countryLabel")}
              </label>
              <input
                id="country"
                type="text"
                placeholder={t("countryPlaceholder")}
                {...step3Form.register("country")}
                className={cn(
                  inputClass,
                  errorInputClass(!!step3Form.formState.errors.country),
                )}
              />
              {fieldError(step3Form.formState.errors.country?.message)}
            </div>

            {/* City + Governorate */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="city" className="text-sm text-brand-black">
                  {t("cityLabel")}
                </label>
                <input
                  id="city"
                  type="text"
                  placeholder={t("cityPlaceholder")}
                  {...step3Form.register("city")}
                  className={cn(
                    inputClass,
                    errorInputClass(!!step3Form.formState.errors.city),
                  )}
                />
                {fieldError(step3Form.formState.errors.city?.message)}
              </div>
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="governorate"
                  className="text-sm text-brand-black"
                >
                  {t("governorateLabel")}
                </label>
                <input
                  id="governorate"
                  type="text"
                  placeholder={t("governoratePlaceholder")}
                  {...step3Form.register("governorate")}
                  className={cn(
                    inputClass,
                    errorInputClass(!!step3Form.formState.errors.governorate),
                  )}
                />
                {fieldError(step3Form.formState.errors.governorate?.message)}
              </div>
            </div>

            {/* Address */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="address" className="text-sm text-brand-black">
                {t("addressLabel")}
              </label>
              <input
                id="address"
                type="text"
                placeholder={t("addressPlaceholder")}
                {...step3Form.register("address")}
                className={cn(
                  inputClass,
                  errorInputClass(!!step3Form.formState.errors.address),
                )}
              />
              {fieldError(step3Form.formState.errors.address?.message)}
            </div>
          </div>

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
              disabled={registerOrganization.isPending}
              className="flex-1 rounded-full bg-brand-primary py-3.5 text-sm font-semibold text-white hover:bg-brand-primary/90 active:scale-[0.99] transition-all disabled:opacity-50"
            >
              {t("submitButton")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
