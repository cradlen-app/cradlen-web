"use client";

import { useMemo, useState } from "react";
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
  getProfileAccountId,
  getProfileAccountName,
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
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

export function SelectProfilePage() {
  const t = useTranslations("auth.selectProfile");
  const roleT = useTranslations("staff.roles");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending] = useState(() => getPendingProfileSelection());
  const profiles = useMemo(() => pending?.profiles ?? [], [pending?.profiles]);
  const initialProfile = profiles.length === 1 ? profiles[0] : null;
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(
    initialProfile,
  );
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(
    getAutoBranchId(initialProfile),
  );
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
    !!getProfileAccountId(selectedProfile) &&
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
    if (!selectedProfile || !canContinue) return;

    const profileId = getProfileId(selectedProfile);
    const accountId = getProfileAccountId(selectedProfile);
    const branchId = getBranchId(selectedBranch);

    if (!profileId || !accountId || !branchId) {
      toast.error(t("missingContext"));
      return;
    }

    try {
      const response = await selectProfile.mutateAsync({
        account_id: accountId,
        branch_id: branchId,
        profile_id: profileId,
      });

      setAuthenticated();
      setContext({
        accountId: response.data.account_id || accountId,
        branchId: response.data.branch_id ?? branchId,
        profileId: response.data.profile_id || profileId,
      });
      clearPendingProfileSelection();
      queryClient.clear();

      const role = getProfileRoles(selectedProfile)[0] ?? ("unknown" as UserRole);
      const redirectTo = getSafeRedirectPath(searchParams.get("redirectTo"));
      router.replace(
        searchParams.get("redirectTo") ? redirectTo : getDefaultRouteForRole(role),
      );
    } catch (error) {
      if (isSessionExpiredError(error)) {
        expireSelectionSession();
        return;
      }

      toast.error(t("error"));
    }
  }

  if (!profiles.length) {
    return (
      <div className="w-full max-w-md rounded-xl border border-gray-100 bg-white p-5 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-brand-black">{t("title")}</h1>
        <p className="mt-2 text-sm text-gray-500">{t("empty")}</p>
        <Button
          type="button"
          onClick={() => router.replace("/sign-in")}
          className="mt-5 rounded-full px-5 py-2.5"
        >
          {t("backToSignIn")}
        </Button>
      </div>
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
              accountName={getProfileAccountName(profile) ?? t("unknownAccount")}
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
                ? {
                    id,
                    isMain: branch.is_main,
                    label: getBranchLabel(branch),
                  }
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
