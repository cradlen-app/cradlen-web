"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/infrastructure/http/api";
import { queryClient } from "@/infrastructure/query/queryClient";
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
} from "../lib/current-user";
import { resolveDefaultRouteAfterAuth } from "../lib/redirect";
import { EXECUTIVE_TITLE, JOB_ROLE } from "../lib/auth.constants";
import { StepIndicator } from "./StepIndicator";
import {
  BranchFields,
  JobRoleFields,
  OrganizationFields,
} from "./signup-complete-fields";
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
import type { UserProfile } from "@/common/types/user.types";
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
      executiveTitle: EXECUTIVE_TITLE.CEO,
      jobRole: JOB_ROLE.NONE,
      doctorSpecialty: "",
      doctorSubspecialties: [],
      professionalTitle: "",
      city: "",
      address: "",
      governorate: "",
      country: "",
      branchName: "",
    },
  });

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
            const resolvedOrgId = selectionRes.data.organization_id || organizationId;
            const resolvedBranchId = selectionRes.data.branch_id ?? branchId;
            const defaultRoute = await resolveDefaultRouteAfterAuth(
              resolvedOrgId,
              resolvedBranchId,
              profile,
            );
            router.replace(defaultRoute);
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
        // The signup-token cookie expired (or is gone). The registration-status
        // guard keeps showing this form because it reads DB state, not the cookie,
        // so don't dead-end here — send the user to sign in, which re-issues a
        // fresh signup token and drops them straight back onto this step.
        clearPendingSignupSession();
        router.replace("/sign-in?notice=resumeOnboarding");
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
        <OrganizationFields form={form} />
        <JobRoleFields form={form} />
        <BranchFields form={form} />


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
