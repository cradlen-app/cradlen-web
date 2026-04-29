"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useRouter } from "@/i18n/navigation";
import { DoctorFields } from "./DoctorFields";
import { RoleSelector } from "./RoleSelector";
import { StepIndicator } from "./StepIndicator";
import { step3Schema } from "../lib/sign-up.schemas";
import { buildRegisterOrganizationRequest } from "../lib/register-organization";
import {
  clearPendingSignupEmail,
  getPendingSignupEmail,
} from "../lib/registration-session";
import { setPendingProfileSelection } from "../lib/profile-selection-session";
import { getSignupResumePath } from "../lib/signup-routing";
import {
  useRegisterOrganization,
  useRegistrationStatus,
} from "../hooks/useSignUp";
import type { Step3Data } from "../types/sign-up.types";

export function SignUpCompleteForm() {
  const t = useTranslations("auth.signUp");
  const router = useRouter();
  const [email] = useState<string | null>(() => getPendingSignupEmail());
  const [stepError, setStepError] = useState<string | null>(null);
  const registrationStatus = useRegistrationStatus(email);
  const registerOrganization = useRegisterOrganization();

  const form = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    mode: "onChange",
    defaultValues: {
      accountName: "",
      specialties: "",
      city: "",
      address: "",
      governorate: "",
      country: "",
      role: "owner",
      specialty: "",
      jobTitle: "",
    },
  });
  const selectedRole = useWatch({
    control: form.control,
    name: "role",
  });

  useEffect(() => {
    if (!email) {
      router.replace("/sign-up");
      return;
    }

    if (
      !registrationStatus.data ||
      registrationStatus.data.step === "COMPLETE_ONBOARDING"
    ) {
      return;
    }

    if (registrationStatus.data.step === "NONE" || registrationStatus.data.step === "DONE") {
      clearPendingSignupEmail();
    }
    router.replace(getSignupResumePath(registrationStatus.data.step));
  }, [email, registrationStatus.data, router]);

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
    if (!email) return;

    setStepError(null);
    try {
      const res = await registerOrganization.mutateAsync(
        buildRegisterOrganizationRequest(email, data),
      );
      clearPendingSignupEmail();

      if (res.data.profiles.length > 0) {
        setPendingProfileSelection({ profiles: res.data.profiles });
        router.push("/select-profile");
        return;
      }

      router.push("/sign-in");
    } catch {
      setStepError(t("errors.serverError"));
    }
  });

  if (!email || registrationStatus.isLoading) {
    return (
      <div className="w-full flex flex-col gap-7">
        <StepIndicator currentStep={3} />
        <p className="text-center text-sm text-gray-500">{t("loading")}</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-7">
      <StepIndicator currentStep={3} />

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="accountName" className="text-sm text-brand-black">
            {t("organizationNameLabel")}
          </label>
          <input
            id="accountName"
            type="text"
            placeholder={t("organizationNamePlaceholder")}
            {...form.register("accountName")}
            className={cn(
              inputClass,
              errorInputClass(!!form.formState.errors.accountName),
            )}
          />
          {fieldError(form.formState.errors.accountName?.message)}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="specialties" className="text-sm text-brand-black">
            {t("specialtiesLabel")}
          </label>
          <input
            id="specialties"
            type="text"
            placeholder={t("specialtiesPlaceholder")}
            {...form.register("specialties")}
            className={cn(
              inputClass,
              errorInputClass(!!form.formState.errors.specialties),
            )}
          />
          {fieldError(form.formState.errors.specialties?.message)}
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="border-b border-gray-100 pb-2 text-sm font-medium text-brand-black">
            {t("mainBranchHeading")}
          </h3>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="country" className="text-sm text-brand-black">
              {t("countryLabel")}
            </label>
            <input
              id="country"
              type="text"
              placeholder={t("countryPlaceholder")}
              {...form.register("country")}
              className={cn(
                inputClass,
                errorInputClass(!!form.formState.errors.country),
              )}
            />
            {fieldError(form.formState.errors.country?.message)}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="city" className="text-sm text-brand-black">
                {t("cityLabel")}
              </label>
              <input
                id="city"
                type="text"
                placeholder={t("cityPlaceholder")}
                {...form.register("city")}
                className={cn(
                  inputClass,
                  errorInputClass(!!form.formState.errors.city),
                )}
              />
              {fieldError(form.formState.errors.city?.message)}
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="governorate" className="text-sm text-brand-black">
                {t("governorateLabel")}
              </label>
              <input
                id="governorate"
                type="text"
                placeholder={t("governoratePlaceholder")}
                {...form.register("governorate")}
                className={cn(
                  inputClass,
                  errorInputClass(!!form.formState.errors.governorate),
                )}
              />
              {fieldError(form.formState.errors.governorate?.message)}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="address" className="text-sm text-brand-black">
              {t("addressLabel")}
            </label>
            <input
              id="address"
              type="text"
              placeholder={t("addressPlaceholder")}
              {...form.register("address")}
              className={cn(
                inputClass,
                errorInputClass(!!form.formState.errors.address),
              )}
            />
            {fieldError(form.formState.errors.address?.message)}
          </div>
        </div>

        <RoleSelector
          heading={t("clinicianHeading")}
          ownerLabel={t("ownerRole")}
          ownerDoctorLabel={t("ownerDoctorRole")}
          registration={form.register("role")}
          error={form.formState.errors.role?.message}
        />

        <DoctorFields
          isVisible={selectedRole === "owner_doctor"}
          register={form.register}
          inputClassName={inputClass}
          specialtyLabel={t("specialtyLabel")}
          specialtyPlaceholder={t("specialtyPlaceholder")}
          jobTitleLabel={t("jobTitleLabel")}
          jobTitlePlaceholder={t("jobTitlePlaceholder")}
        />

        {stepError && (
          <p className="text-center text-sm text-red-500">{stepError}</p>
        )}

        <div className="flex gap-3 mt-1">
          <button
            type="button"
            onClick={() => router.push("/sign-up/verify")}
            className="flex-1 rounded-full border border-brand-primary py-3.5 text-sm font-semibold text-brand-primary transition-all hover:bg-brand-primary/5"
          >
            {t("backButton")}
          </button>
          <button
            type="submit"
            disabled={!form.formState.isValid || registerOrganization.isPending}
            className="flex-1 rounded-full bg-brand-primary py-3.5 text-sm font-semibold text-white transition-all hover:bg-brand-primary/90 active:scale-[0.99] disabled:opacity-50"
          >
            {registerOrganization.isPending
              ? `${t("submitButton")}...`
              : t("submitButton")}
          </button>
        </div>
      </form>
    </div>
  );
}
