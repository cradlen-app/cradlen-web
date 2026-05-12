"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Eye, EyeOff } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/common/utils/utils";
import { queryClient } from "@/infrastructure/query/queryClient";
import {
  getProfilesFromAuthResponse,
  isOnboardingRedirectPath,
  resolveAuthRedirect,
} from "@/lib/auth/redirect";
import { createSignInSchema, type SignInFormData } from "../lib/sign-in.schemas";
import { useSignIn } from "../hooks/useSignIn";
import { useSelectProfile } from "../hooks/useSelectProfile";
import { getSafeRedirectPath, getDefaultRouteForRole } from "../lib/redirect";
import {
  clearPendingProfileSelection,
  setPendingProfileSelection,
} from "../lib/profile-selection-session";
import { classifySignInError } from "../lib/sign-in-errors";
import {
  getBranchId,
  getProfileOrganizationId,
  getProfileBranches,
  getProfileId,
  getProfileRoles,
} from "../lib/current-user";
import { useAuthStore } from "../store/authStore";
import { useAuthContextStore } from "../store/authContextStore";
import { useAvailableProfilesStore } from "../store/availableProfilesStore";

export function SignInForm() {
  const t = useTranslations("auth.signIn");
  const [showPassword, setShowPassword] = useState(false);
  const [fallbackError, setFallbackError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { mutateAsync, isError, error } = useSignIn();
  const { mutateAsync: selectProfileAsync } = useSelectProfile();
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const setContext = useAuthContextStore((state) => state.setContext);
  const setAvailableProfiles = useAvailableProfilesStore(
    (state) => state.setAvailableProfiles,
  );
  const redirectTo = getSafeRedirectPath(searchParams.get("redirectTo"));
  const notice = searchParams.get("notice");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormData>({
    resolver: zodResolver(createSignInSchema(t)),
  });

  const onSubmit = async (data: SignInFormData) => {
    setFallbackError(null);
    // Don't carry a previous attempt's profile list into this sign-in.
    clearPendingProfileSelection();

    try {
      const res = await mutateAsync(data);
      const nextPath = resolveAuthRedirect(res, data.email);

      if (isOnboardingRedirectPath(nextPath)) {
        // Login returned ONBOARDING_REQUIRED. Backend never issues a fresh signup_token here,
        // so route the user back to the start of signup with email pre-filled via query.
        router.replace(`${nextPath}?resume=1&email=${encodeURIComponent(data.email)}`);
        return;
      }

      if (nextPath === "/select-profile") {
        const profiles = getProfilesFromAuthResponse(res);
        // Cache the full multi-org list for the nav bar's profile switcher.
        // Mirrors the selection_token's 30-min server TTL.
        setAvailableProfiles(profiles);

        if (profiles.length === 1 && getProfileBranches(profiles[0]).length === 1) {
          const profile = profiles[0];
          const branch = getProfileBranches(profile)[0];
          const profileId = getProfileId(profile);
          const organizationId = getProfileOrganizationId(profile);
          const branchId = getBranchId(branch);

          if (profileId && organizationId && branchId) {
            try {
              // Single-branch fast path: omit branch_id and let the backend pick.
              const selRes = await selectProfileAsync({
                profile_id: profileId,
                organization_id: organizationId,
              });
              setAuthenticated();
              setContext({
                organizationId: selRes.data.organization_id || organizationId,
                branchId: selRes.data.branch_id ?? branchId,
                profileId: selRes.data.profile_id || profileId,
              });
              queryClient.clear();
              const role = getProfileRoles(profile)[0] ?? "unknown";
              const resolvedOrgId = selRes.data.organization_id || organizationId;
              const resolvedBranchId = selRes.data.branch_id ?? branchId;
              router.replace(redirectTo ?? getDefaultRouteForRole(role, resolvedOrgId, resolvedBranchId));
              return;
            } catch {
              // Fall through to normal /select-profile flow
            }
          }
        }

        setPendingProfileSelection({ profiles });
        router.replace(
          redirectTo
            ? `/select-profile?redirectTo=${encodeURIComponent(redirectTo)}`
            : "/select-profile",
        );
        return;
      }

      setFallbackError(t("errors.noProfiles"));
    } catch {
      // error state handled via mutation.isError
    }
  };

  const errorKind = isError ? classifySignInError(error) : null;
  const apiErrorMessage =
    fallbackError ?? (errorKind ? t(`errors.${errorKind}`) : null);

  const inputClass = cn(
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-brand-black",
    "placeholder:text-gray-400 outline-none transition-colors",
    "focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20",
  );

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full flex flex-col gap-5"
    >
      {notice === "organization-exists" && (
        <p className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 text-center">
          {t("noticeAccountExists")}
        </p>
      )}
      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm text-brand-black">
          {t("emailLabel")}
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          {...register("email")}
          className={cn(inputClass, errors.email && "border-red-400")}
        />
        {errors.email && (
          <p className="text-xs text-red-500">{errors.email.message}</p>
        )}
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm text-brand-black">
            {t("passwordLabel")}
          </label>
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? (
              <Eye className="size-4" />
            ) : (
              <EyeOff className="size-4" />
            )}
            {showPassword ? t("hidePassword") : t("showPassword")}
          </button>
        </div>
        <input
          id="password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          {...register("password")}
          className={cn(inputClass, errors.password && "border-red-400")}
        />
        {errors.password && (
          <p className="text-xs text-red-500">{errors.password.message}</p>
        )}
      </div>

      {/* API error */}
      {apiErrorMessage && (
        <p className="text-sm text-red-500 text-center">{apiErrorMessage}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-1 w-full rounded-full bg-brand-primary py-3.5 text-sm font-semibold text-white hover:bg-brand-primary/90 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
      >
        {t("submitButton")}
      </button>

      {/* Forgot password */}
      <Link
        href="/forgot-password"
        className="text-right text-sm text-brand-secondary underline underline-offset-2 hover:opacity-80 transition-opacity"
      >
        {t("forgotPassword")}
      </Link>
    </form>
  );
}
