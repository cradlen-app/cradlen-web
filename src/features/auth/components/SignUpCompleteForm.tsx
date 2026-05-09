"use client";

import { useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import {
  getProfilesFromAuthResponse,
  isOnboardingRedirectPath,
  resolveAuthRedirect,
} from "@/lib/auth/redirect";
import {
  getBranchId,
  getProfileOrganizationId,
  getProfileBranches,
  getProfileId,
  getProfileRoles,
} from "../lib/current-user";
import { getDefaultRouteForRole } from "../lib/redirect";
import { SpecialtiesSelect } from "@/components/common/SpecialtiesSelect";
import { StepIndicator } from "./StepIndicator";
import { makeStep3Schema } from "../lib/sign-up.schemas";
import { buildRegisterOrganizationRequest } from "../lib/register-organization";
import { clearPendingSignupSession } from "../lib/registration-session";
import {
  clearPendingProfileSelection,
  setPendingProfileSelection,
} from "../lib/profile-selection-session";
import { useRegisterOrganization } from "../hooks/useSignUp";
import { useSelectProfile } from "../hooks/useSelectProfile";
import { useAuthStore } from "../store/authStore";
import { useAuthContextStore } from "../store/authContextStore";
import { useAvailableProfilesStore } from "../store/availableProfilesStore";
import type { UserProfile, UserRole } from "@/types/user.types";
import type { Step3Data } from "../types/sign-up.types";

function canAutoSelect(profiles: UserProfile[]): boolean {
  if (profiles.length !== 1) return false;
  const branches = getProfileBranches(profiles[0]);
  return branches.length === 1 && !!getBranchId(branches[0]);
}

export function SignUpCompleteForm() {
  const t = useTranslations("auth.signUp");
  const schema = useMemo(() => makeStep3Schema(t), [t]);
  const router = useRouter();
  const { email, isChecking } = useAuthRedirect({
    currentStep: "COMPLETE_ONBOARDING",
  });
  const [stepError, setStepError] = useState<string | null>(null);
  const registerOrganization = useRegisterOrganization();
  const selectProfile = useSelectProfile();
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const setContext = useAuthContextStore((state) => state.setContext);
  const setAvailableProfiles = useAvailableProfilesStore(
    (state) => state.setAvailableProfiles,
  );

  const form = useForm<Step3Data>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      organizationName: "",
      specialties: [],
      city: "",
      address: "",
      governorate: "",
      country: "",
      branchName: "",
    },
  });

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
    try {
      const res = await registerOrganization.mutateAsync(
        buildRegisterOrganizationRequest(data),
      );
      const nextPath = resolveAuthRedirect(res, email ?? undefined);

      if (nextPath === "/select-profile") {
        const profiles = getProfilesFromAuthResponse(res);
        setAvailableProfiles(profiles);

        if (canAutoSelect(profiles)) {
          const profile = profiles[0];
          const branch = getProfileBranches(profile)[0];
          const profileId = getProfileId(profile)!;
          const organizationId = getProfileOrganizationId(profile)!;
          const branchId = getBranchId(branch)!;
          try {
            // canAutoSelect already gates on branches.length === 1, so omit branch_id.
            const selectionRes = await selectProfile.mutateAsync({
              profile_id: profileId,
              organization_id: organizationId,
            });
            setAuthenticated();
            setContext({
              organizationId: selectionRes.data.organization_id || organizationId,
              branchId: selectionRes.data.branch_id ?? branchId,
              profileId: selectionRes.data.profile_id || profileId,
            });
            clearPendingProfileSelection();
            queryClient.clear();
            const role = getProfileRoles(profile)[0] ?? ("unknown" as UserRole);
            const resolvedOrgId = selectionRes.data.organization_id || organizationId;
            const resolvedBranchId = selectionRes.data.branch_id ?? branchId;
            router.replace(getDefaultRouteForRole(role, resolvedOrgId, resolvedBranchId));
            return;
          } catch {
            // Fall through to manual /select-profile so the user can retry.
          }
        }

        clearPendingSignupSession();
        setPendingProfileSelection({ profiles });
        router.replace("/select-profile");
        return;
      }

      if (isOnboardingRedirectPath(nextPath)) {
        clearPendingSignupSession();
        router.replace(nextPath);
        return;
      }

      clearPendingSignupSession();
      router.replace("/sign-in");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearPendingSignupSession();
        setStepError(t("errors.sessionExpired"));
        return;
      }

      setStepError(t("errors.serverError"));
    }
  });

  if (isChecking) {
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
          <label htmlFor="organizationName" className="text-sm text-brand-black">
            {t("organizationNameLabel")}
          </label>
          <input
            id="organizationName"
            type="text"
            placeholder={t("organizationNamePlaceholder")}
            {...form.register("organizationName")}
            className={cn(
              inputClass,
              errorInputClass(!!form.formState.errors.organizationName),
            )}
          />
          {fieldError(form.formState.errors.organizationName?.message)}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-brand-black">
            {t("specialtiesLabel")}
          </label>
          <Controller
            control={form.control}
            name="specialties"
            render={({ field }) => (
              <SpecialtiesSelect
                value={field.value}
                onChange={field.onChange}
                placeholder={t("specialtiesPlaceholder")}
                hasError={!!form.formState.errors.specialties}
              />
            )}
          />
          {fieldError(form.formState.errors.specialties?.message as string | undefined)}
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="border-b border-gray-100 pb-2 text-sm font-medium text-brand-black">
            {t("mainBranchHeading")}
          </h3>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="branchName" className="text-sm text-brand-black">
              {t("branchNameLabel")}
            </label>
            <input
              id="branchName"
              type="text"
              placeholder={t("branchNamePlaceholder")}
              {...form.register("branchName")}
              className={cn(
                inputClass,
                errorInputClass(!!form.formState.errors.branchName),
              )}
            />
            {fieldError(form.formState.errors.branchName?.message)}
          </div>

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
