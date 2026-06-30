"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  CURRENT_USER_QUERY_KEY,
  useCurrentUser,
} from "@/features/auth/hooks/useCurrentUser";
import {
  getActiveProfile,
  getRawProfileRole,
} from "@/features/auth/lib/current-user";
import { isOwner as isOwnerPerm } from "@/features/auth/lib/permissions";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { useUserStore } from "@/features/auth/store/userStore";
import type { CurrentUser } from "@/common/types/user.types";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/infrastructure/http/api";
import { queryClient } from "@/infrastructure/query/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import {
  deleteBranch,
  deleteOrganization,
  listBranches,
  type OrganizationBranch,
} from "../lib/settings.api";
import { SettingsConfirmDialogs } from "./settings-dialogs";
import {
  AccountSection,
  BranchesSection,
  DangerSection,
  OrganizationSection,
  ProfileSection,
} from "./settings-sections";
import { NotificationsSection } from "./settings-notifications-section";
import { SubscriptionSection } from "@/features/subscriptions/components/SubscriptionSection";
import {
  getVisibleSections,
  type DrawerKey,
  type SectionKey,
  type SoftDeleteKey,
} from "./settings.types";
import { formatRole, type SettingsLocale } from "./settings.utils";
import {
  SettingsDrawers,
  SettingsHeader,
  SettingsNav,
} from "./settings-page-sections";

export function SettingsPage() {
  const t = useTranslations("settings");
  const locale = useLocale() as SettingsLocale;
  const router = useRouter();
  const { data: user, isError, isLoading } = useCurrentUser();
  const profile = getActiveProfile(user);
  const isOwner = isOwnerPerm(profile);
  const visibleSections = getVisibleSections(isOwner, profile);

  const searchParams = useSearchParams();
  const requestedSection = searchParams.get("section") as SectionKey | null;
  const [activeSectionState, setActiveSection] = useState<SectionKey>(
    requestedSection ?? "profile",
  );
  const [activeDrawer, setActiveDrawer] = useState<DrawerKey>(null);
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
  const [confirmSoftDelete, setConfirmSoftDelete] =
    useState<SoftDeleteKey>(null);

  // Coerce: if a non-owner somehow has an owner-only section selected, fall back.
  const activeSection: SectionKey = visibleSections.some(
    (s) => s.key === activeSectionState,
  )
    ? activeSectionState
    : "profile";

  const clearSession = useAuthStore((state) => state.clearSession);
  const clearUser = useUserStore((state) => state.clearUser);
  const currentBranchId = useAuthContextStore((state) => state.branchId);
  const organizationId = profile?.organization.id;

  const { data: branchesData, isLoading: branchesLoading } = useQuery({
    queryKey: queryKeys.settings.branches(organizationId ?? ""),
    queryFn: () => listBranches(organizationId!),
    enabled: !!organizationId && isOwner,
  });
  const branches: OrganizationBranch[] = branchesData?.data ?? [];

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-sm text-gray-400">
        {t("loading")}
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-sm text-red-400">
        {t("loadError")}
      </div>
    );
  }

  const displayName = `${user.first_name} ${user.last_name}`;

  async function forceSignOut() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // best-effort
    }
    clearSession();
    clearUser();
    queryClient.clear();
    router.replace("/sign-in");
  }

  async function handleSoftDeleteConfirm() {
    try {
      if (confirmSoftDelete?.type === "organization") {
        if (!profile?.organization.id) return;
        await deleteOrganization(profile.organization.id);
        toast.success(t("organization.deleteSuccess"));
        setConfirmSoftDelete(null);
        await forceSignOut();
        return;
      }

      if (confirmSoftDelete?.type === "branch") {
        if (!confirmSoftDelete.branchId || !profile?.organization.id) return;
        const deletedBranchId = confirmSoftDelete.branchId;
        const isLastBranch = branches.length <= 1;
        await deleteBranch(profile.organization.id, deletedBranchId);
        toast.success(t("branches.deleteSuccess"));
        setConfirmSoftDelete(null);

        if (isLastBranch) {
          await forceSignOut();
          return;
        }

        queryClient.setQueryData(CURRENT_USER_QUERY_KEY, (old: CurrentUser | undefined) => {
          if (!old) return old;
          return {
            ...old,
            profiles: old.profiles.map((p) => ({
              ...p,
              branches: p.branches.filter((b) => b.id !== deletedBranchId),
            })),
          };
        });

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY }),
          queryClient.invalidateQueries({
            queryKey: queryKeys.settings.branches(profile.organization.id),
          }),
          queryClient.invalidateQueries({ queryKey: queryKeys.calendar.all() }),
          queryClient.invalidateQueries({
            queryKey: queryKeys.visits.branch(deletedBranchId),
          }),
        ]);
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) {
        toast.error(
          confirmSoftDelete?.type === "organization"
            ? t("organization.deleteForbidden")
            : t("branches.deleteForbidden"),
        );
      } else {
        toast.error(
          confirmSoftDelete?.type === "organization"
            ? t("organization.deleteError")
            : t("branches.deleteError"),
        );
      }
    }
  }

  const sectionProps = {
    branches,
    branchesLoading,
    currentBranchId,
    displayName,
    locale,
    profile,
    setActiveDrawer,
    setActiveBranchId,
    setConfirmSoftDelete,
    t,
    user,
  };

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4 lg:p-6">
      <SettingsHeader
        active={user.is_active}
        roleLabel={formatRole(getRawProfileRole(profile), t)}
        t={t}
      />

      <div className="flex min-w-0 flex-col gap-4">
        <SettingsNav
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          sections={visibleSections}
          t={t}
        />

        <div className="min-w-0">
          {activeSection === "profile" && <ProfileSection {...sectionProps} />}
          {activeSection === "account" && (
            <AccountSection user={user} t={t} />
          )}
          {activeSection === "notifications" && <NotificationsSection t={t} />}
          {activeSection === "organization" && isOwner && (
            <OrganizationSection {...sectionProps} />
          )}
          {activeSection === "branches" && isOwner && (
            <BranchesSection {...sectionProps} />
          )}
          {activeSection === "subscription" && isOwner && (
            <SubscriptionSection />
          )}
          {activeSection === "danger" && isOwner && (
            <DangerSection {...sectionProps} />
          )}
        </div>
      </div>

      <SettingsDrawers
        activeBranchId={activeBranchId}
        activeDrawer={activeDrawer}
        branches={branches}
        onClose={() => {
          setActiveDrawer(null);
          setActiveBranchId(null);
        }}
        profile={profile}
        t={t}
        user={user}
      />

      <SettingsConfirmDialogs
        branches={branches}
        cancelLabel={t("cancel")}
        confirmSoftDelete={confirmSoftDelete}
        organizationName={profile?.organization.name ?? ""}
        onSoftDeleteConfirm={handleSoftDeleteConfirm}
        onSoftDeleteChange={setConfirmSoftDelete}
        t={t}
      />
    </div>
  );
}

