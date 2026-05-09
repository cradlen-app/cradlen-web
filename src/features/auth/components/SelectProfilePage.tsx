"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  clearPendingProfileSelection,
  getPendingProfileSelection,
} from "../lib/profile-selection-session";
import {
  getBranchId,
  getDefaultBranch,
  getProfileOrganizationId,
  getProfileOrganizationName,
  getProfileBranches,
  getProfileId,
  getProfileRoles,
} from "../lib/current-user";
import { getDefaultRouteForRole, getSafeRedirectPath } from "../lib/redirect";
import { useSelectProfile } from "../hooks/useSelectProfile";
import { useAuthStore } from "../store/authStore";
import { useAuthContextStore } from "../store/authContextStore";
import { useUserStore } from "../store/userStore";
import { BranchSelector } from "./BranchSelector";
import { ProfileCard } from "./ProfileCard";
import { SelectionLayout } from "./SelectionLayout";
import type { UserBranch, UserProfile, UserRole } from "@/types/user.types";

function getAutoBranchId(profile?: UserProfile | null) {
  const branches = getProfileBranches(profile ?? undefined);

  if (branches.length !== 1) return null;
  return getBranchId(branches[0]) ?? null;
}

function getBranchLabel(branch: UserBranch) {
  return (
    branch.name ||
    [branch.address, branch.city, branch.governorate, branch.country]
      .filter(Boolean)
      .join(", ")
  );
}

function isSessionExpiredError(error: unknown) {
  return error instanceof ApiError && error.status === 401;
}

function isProfileUnavailableError(error: unknown) {
  return error instanceof ApiError && error.status === 403;
}

export function SelectProfilePage() {
  const t = useTranslations("auth.selectProfile");
  const roleT = useTranslations("staff.roles");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [pending, setPending] = useState<ReturnType<typeof getPendingProfileSelection>>(null);
  const profiles = useMemo(() => pending?.profiles ?? [], [pending?.profiles]);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [isAutoProceeding, setIsAutoProceeding] = useState(false);
  const autoTriggered = useRef(false);
  const selectProfile = useSelectProfile();
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const clearSession = useAuthStore((state) => state.clearSession);
  const setContext = useAuthContextStore((state) => state.setContext);
  const clearContext = useAuthContextStore((state) => state.clearContext);
  const clearUser = useUserStore((state) => state.clearUser);

  const branches = getProfileBranches(selectedProfile ?? undefined);
  const hasNoBranches = !!selectedProfile && branches.length === 0;
  const selectedBranch = selectedProfile
    ? getDefaultBranch(selectedProfile, selectedBranchId)
    : undefined;
  const canContinue =
    !!selectedProfile &&
    !!getProfileId(selectedProfile) &&
    !!getProfileOrganizationId(selectedProfile) &&
    branches.length > 0 &&
    (branches.length === 1 || !!selectedBranchId);

  function chooseProfile(profile: UserProfile) {
    setSelectedProfile(profile);
    setSelectedBranchId(getAutoBranchId(profile));
  }

  function getRoleLabels(profile: UserProfile) {
    return getProfileRoles(profile)
      .map((role) => roleT(role as Parameters<typeof roleT>[0]))
      .join(", ");
  }

  function expireSelectionSession() {
    clearPendingProfileSelection();
    clearSession();
    clearContext();
    clearUser();
    queryClient.clear();
    toast.error(t("invalidSession"));
    router.replace("/sign-in");
  }

  async function handleContinue() {
    if (!selectedProfile || !canContinue) {
      setIsAutoProceeding(false);
      return;
    }

    const profileId = getProfileId(selectedProfile);
    const organizationId = getProfileOrganizationId(selectedProfile);
    const branchId = getBranchId(selectedBranch);

    if (!profileId || !organizationId || !branchId) {
      setIsAutoProceeding(false);
      toast.error(t("missingContext"));
      return;
    }

    try {
      const response = await selectProfile.mutateAsync({
        branch_id: branchId,
        profile_id: profileId,
        organization_id: organizationId,
      });

      setAuthenticated();
      setContext({
        organizationId: response.data.organization_id || organizationId,
        branchId: response.data.branch_id ?? branchId,
        profileId: response.data.profile_id || profileId,
      });
      clearPendingProfileSelection();
      queryClient.clear();

      const resolvedOrgId = response.data.organization_id || organizationId;
      const resolvedBranchId = response.data.branch_id ?? branchId;
      const role = getProfileRoles(selectedProfile)[0] ?? ("unknown" as UserRole);
      const redirectTo = getSafeRedirectPath(searchParams.get("redirectTo"));
      router.replace(
        redirectTo ?? getDefaultRouteForRole(role, resolvedOrgId, resolvedBranchId),
      );
    } catch (error) {
      setIsAutoProceeding(false);
      if (isSessionExpiredError(error)) {
        expireSelectionSession();
        return;
      }

      if (isProfileUnavailableError(error)) {
        toast.error(t("profileUnavailable"));
        return;
      }

      toast.error(t("error"));
    }
  }

  // Read sessionStorage on mount — must not run during SSR to avoid hydration mismatch.
  useEffect(() => {
    const data = getPendingProfileSelection();
    const sp = data && data.profiles.length === 1 ? data.profiles[0] : null;
    // One-time client-only read; React batches these into a single render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPending(data);
    setSelectedProfile(sp);
    setSelectedBranchId(getAutoBranchId(sp));
    setMounted(true);
  }, []);

  // Auto-proceed when there is exactly 1 profile with exactly 1 branch.
  useEffect(() => {
    if (!mounted) return;
    if (autoTriggered.current) return;
    if (profiles.length === 1 && getAutoBranchId(profiles[0])) {
      autoTriggered.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- triggers async mutation; setState in catch is not synchronous
      setIsAutoProceeding(true);
      handleContinue();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  if (!mounted) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
      </div>
    );
  }

  if (!profiles.length) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
        <p className="text-base font-semibold text-brand-black">{t("title")}</p>
        <p className="mt-2 text-sm text-gray-400">{t("empty")}</p>
        <Button
          type="button"
          onClick={() => router.replace("/sign-in")}
          className="mt-6 h-10 rounded-full px-6 bg-brand-primary text-white text-sm font-medium hover:bg-brand-primary/90"
        >
          {t("backToSignIn")}
        </Button>
      </div>
    );
  }

  if (isAutoProceeding) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
        <p className="text-sm text-gray-500">{t("signingIn")}</p>
      </div>
    );
  }

  // Single profile with multiple branches — skip profile card, go straight to branch selection.
  if (profiles.length === 1 && branches.length > 1) {
    return (
      <SelectionLayout
        title={t("selectBranch")}
        subtitle={t("selectBranchSubtitle")}
        actions={
          <Button
            type="button"
            disabled={!canContinue || selectProfile.isPending}
            onClick={handleContinue}
            className="h-11 w-full rounded-full bg-brand-primary text-sm font-semibold text-white hover:bg-brand-primary/90"
          >
            {selectProfile.isPending ? t("loading") : t("continue")}
          </Button>
        }
      >
        <BranchSelector
          title={t("branch")}
          branches={branches
            .map((branch) => {
              const id = getBranchId(branch);
              return id
                ? { id, isMain: branch.is_main, label: getBranchLabel(branch) }
                : null;
            })
            .filter((b): b is NonNullable<typeof b> => !!b)}
          selectedBranchId={selectedBranchId}
          onChange={setSelectedBranchId}
          mainBranchLabel={t("mainBranch")}
        />
      </SelectionLayout>
    );
  }

  return (
    <SelectionLayout
      title={t("title")}
      subtitle={t("subtitle")}
      actions={
        <Button
          type="button"
          disabled={!canContinue || selectProfile.isPending}
          onClick={handleContinue}
          className="h-11 w-full rounded-full bg-brand-primary text-sm font-semibold text-white hover:bg-brand-primary/90"
        >
          {selectProfile.isPending ? t("loading") : t("continue")}
        </Button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {profiles.map((profile, index) => {
          const profileId = getProfileId(profile);
          const selectedProfileId = selectedProfile
            ? getProfileId(selectedProfile)
            : null;
          const branchCount = getProfileBranches(profile).length;

          return (
            <ProfileCard
              key={profileId ?? `profile-${index}`}
              organizationName={getProfileOrganizationName(profile) ?? t("unknownAccount")}
              branchCountLabel={t("branchCount", { count: branchCount })}
              isSelected={!!profileId && selectedProfileId === profileId}
              onSelect={() => chooseProfile(profile)}
              rolesLabel={getRoleLabels(profile) || t("unknownRole")}
            />
          );
        })}
      </div>

      {hasNoBranches && (
        <p className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {t("noBranches")}
        </p>
      )}

      {selectedProfile && branches.length > 1 && (
        <BranchSelector
          title={t("branch")}
          branches={branches
            .map((branch) => {
              const id = getBranchId(branch);
              return id
                ? { id, isMain: branch.is_main, label: getBranchLabel(branch) }
                : null;
            })
            .filter((branch): branch is NonNullable<typeof branch> => !!branch)}
          selectedBranchId={selectedBranchId}
          onChange={setSelectedBranchId}
          mainBranchLabel={t("mainBranch")}
        />
      )}

    </SelectionLayout>
  );
}
