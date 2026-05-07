"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { useSwitchBranch } from "@/features/auth/hooks/useSwitchBranch";
import {
  getDefaultBranch,
  getProfileOrganizationId,
  getProfileBranches,
} from "@/features/auth/lib/current-user";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { queryClient } from "@/lib/queryClient";
import type { UserProfile } from "@/types/user.types";

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
  const isSwitching = switchBranch.isPending;

  useEffect(() => {
    if (!branchMenuOpen) return;
    function handler(e: MouseEvent) {
      if (!branchMenuRef.current?.contains(e.target as Node))
        setBranchMenuOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [branchMenuOpen]);

  const branch = getDefaultBranch(profile, branchId);
  const branches = getProfileBranches(profile);
  const hasMultipleBranches = branches.length > 1;

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

  return {
    branchMenuOpen,
    setBranchMenuOpen,
    branchMenuRef,
    switchingToBranchId,
    isSwitching,
    branch,
    branches,
    branchId,
    hasMultipleBranches,
    handleBranchSwitch,
  };
}
