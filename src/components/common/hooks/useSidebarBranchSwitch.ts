"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { useSwitchBranch } from "@/features/auth/hooks/useSwitchBranch";
import { useSelectProfile } from "@/features/auth/hooks/useSelectProfile";
import {
  getBranchId,
  getDefaultBranch,
  getProfileBranches,
  getProfileId,
  getProfileOrganization,
  getProfileOrganizationId,
} from "@/features/auth/lib/current-user";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import {
  getValidAvailableProfiles,
  useAvailableProfilesStore,
} from "@/features/auth/store/availableProfilesStore";
import { queryClient } from "@/infrastructure/query/queryClient";
import type { UserBranch, UserProfile } from "@/common/types/user.types";

export type WorkspaceGroup = {
  profile: UserProfile;
  profileId: string;
  organizationId: string;
  organizationName: string;
  branches: UserBranch[];
  isActiveProfile: boolean;
};

export function useSidebarBranchSwitch(profile: UserProfile | undefined) {
  const [branchMenuOpen, setBranchMenuOpen] = useState(false);
  const [switchingToBranchId, setSwitchingToBranchId] = useState<
    string | null
  >(null);

  const branchMenuRef = useRef<HTMLDivElement>(null);

  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();
  const branchId = useAuthContextStore((s) => s.branchId);
  const profileId = useAuthContextStore((s) => s.profileId);
  const setContext = useAuthContextStore((s) => s.setContext);
  const switchBranch = useSwitchBranch();
  const selectProfile = useSelectProfile();
  const availableProfiles = useAvailableProfilesStore((s) =>
    getValidAvailableProfiles(s),
  );

  const isSwitching = switchBranch.isPending || selectProfile.isPending;

  useEffect(() => {
    if (!branchMenuOpen) return;
    function handler(e: MouseEvent) {
      if (!branchMenuRef.current?.contains(e.target as Node))
        setBranchMenuOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [branchMenuOpen, setBranchMenuOpen]);

  const branch = getDefaultBranch(profile, branchId);
  const branches = getProfileBranches(profile);
  const hasMultipleBranches = branches.length > 1;

  const activeProfileId = profile ? getProfileId(profile) : undefined;

  const groups = useMemo<WorkspaceGroup[]>(() => {
    const result: WorkspaceGroup[] = [];
    const seenProfileIds = new Set<string>();

    function pushProfile(p: UserProfile, isActive: boolean) {
      const pid = getProfileId(p);
      if (!pid || seenProfileIds.has(pid)) return;
      const orgId = getProfileOrganizationId(p);
      if (!orgId) return;
      const orgName = getProfileOrganization(p)?.name ?? "";
      const profileBranches = getProfileBranches(p);
      seenProfileIds.add(pid);
      result.push({
        profile: p,
        profileId: pid,
        organizationId: orgId,
        organizationName: orgName,
        branches: profileBranches,
        isActiveProfile: isActive,
      });
    }

    if (profile) pushProfile(profile, true);
    for (const p of availableProfiles) {
      pushProfile(p, getProfileId(p) === activeProfileId);
    }
    return result;
  }, [profile, availableProfiles, activeProfileId]);

  const hasMultipleProfiles = groups.length > 1;
  const hasMultipleOptions = hasMultipleBranches || hasMultipleProfiles;

  async function handleBranchSwitch(newBranchId: string) {
    if (!profile) return;
    setSwitchingToBranchId(newBranchId);
    try {
      await switchBranch.mutateAsync({ branch_id: newBranchId });
      const orgId = getProfileOrganizationId(profile);
      if (!orgId) {
        setSwitchingToBranchId(null);
        toast.error(t("switchBranchError"));
        return;
      }
      setContext({
        organizationId: orgId,
        branchId: newBranchId,
        profileId: profileId ?? "",
      });
      queryClient.clear();
      const dashboardSegment = pathname.split("/").slice(3).join("/");
      router.replace(`/${orgId}/${newBranchId}/${dashboardSegment}`);
      setBranchMenuOpen(false);
    } catch (error) {
      console.error("[branch-switch]", error);
      setSwitchingToBranchId(null);
      toast.error(t("switchBranchError"));
    }
  }

  async function handleProfileSwitch(
    targetProfileId: string,
    targetBranchId: string,
  ) {
    const target = availableProfiles.find(
      (p) => getProfileId(p) === targetProfileId,
    );
    if (!target) return;
    const orgId = getProfileOrganizationId(target);
    if (!orgId) return;

    const multiBranch = getProfileBranches(target).length > 1;
    setSwitchingToBranchId(targetBranchId);
    try {
      const response = await selectProfile.mutateAsync({
        profile_id: targetProfileId,
        organization_id: orgId,
        ...(multiBranch ? { branch_id: targetBranchId } : {}),
      });
      const newOrgId = response.data.organization_id || orgId;
      const newBranchId = response.data.branch_id ?? targetBranchId;
      setContext({
        organizationId: newOrgId,
        branchId: newBranchId,
        profileId: response.data.profile_id || targetProfileId,
      });
      queryClient.clear();
      const dashboardSegment = pathname.split("/").slice(3).join("/");
      router.replace(`/${newOrgId}/${newBranchId ?? ""}/${dashboardSegment}`);
      setBranchMenuOpen(false);
    } catch (error) {
      console.error("[profile-switch]", error);
      setSwitchingToBranchId(null);
      toast.error(t("profileSwitcher"));
    }
  }

  async function handleSelect(
    targetProfileId: string,
    targetBranchId: string,
  ) {
    if (targetProfileId === activeProfileId) {
      if (targetBranchId === (branchId ?? getBranchId(branch))) {
        setBranchMenuOpen(false);
        return;
      }
      await handleBranchSwitch(targetBranchId);
      return;
    }
    await handleProfileSwitch(targetProfileId, targetBranchId);
  }

  return {
    branchMenuOpen,
    setBranchMenuOpen,
    branchMenuRef,
    switchingToBranchId,
    isSwitching,
    branch,
    branches,
    branchId,
    activeProfileId,
    groups,
    hasMultipleBranches,
    hasMultipleProfiles,
    hasMultipleOptions,
    handleBranchSwitch,
    handleSelect,
  };
}
