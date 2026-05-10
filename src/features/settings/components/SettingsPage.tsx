"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  CURRENT_USER_QUERY_KEY,
  useCurrentUser,
} from "@/features/auth/hooks/useCurrentUser";
import {
  getActiveProfile,
  getProfilePrimaryRole,
} from "@/features/auth/lib/current-user";
import { isOwner as isOwnerPerm } from "@/features/auth/lib/permissions";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { useUserStore } from "@/features/auth/store/userStore";
import type { CurrentUser } from "@/types/user.types";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { cn } from "@/lib/utils";
import {
  deleteBranch,
  deleteOrganization,
  listBranches,
  type OrganizationBranch,
} from "../lib/settings.api";
import { SettingsConfirmDialogs } from "./settings-dialogs";
import { BranchForm, OrganizationForm, ProfileForm } from "./settings-forms";
import {
  AccountSection,
  BranchesSection,
  DangerSection,
  OrganizationSection,
  ProfileSection,
} from "./settings-sections";
import {
  getVisibleSections,
  type DrawerKey,
  type SectionKey,
  type SoftDeleteKey,
} from "./settings.types";
import { formatRole, type SettingsLocale } from "./settings.utils";
import { SettingsDrawer } from "./settings-ui";

export function SettingsPage() {
  const t = useTranslations("settings");
  const locale = useLocale() as SettingsLocale;
  const router = useRouter();
  const { data: user, isError, isLoading } = useCurrentUser();
  const profile = getActiveProfile(user);
  const isOwner = isOwnerPerm(profile);
  const visibleSections = getVisibleSections(isOwner);

  const [activeSectionState, setActiveSection] = useState<SectionKey>("profile");
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
        roleLabel={formatRole(getProfilePrimaryRole(profile), t)}
        t={t}
      />

      <div className="grid min-h-0 gap-4 md:grid-cols-[14rem_1fr]">
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
          {activeSection === "organization" && isOwner && (
            <OrganizationSection {...sectionProps} />
          )}
          {activeSection === "branches" && isOwner && (
            <BranchesSection {...sectionProps} />
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

function SettingsHeader({
  active,
  roleLabel,
  t,
}: {
  active: boolean;
  roleLabel: string;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <header className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm shadow-gray-100/60">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase text-brand-primary">
            {t("eyebrow")}
          </p>
          <h1 className="mt-1 text-2xl font-medium text-brand-black">
            {t("title")}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-400">
            {t("description")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-brand-primary/8 px-3 py-1 text-sm font-medium text-brand-primary">
            {roleLabel}
          </span>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
            {active ? t("status.active") : t("status.inactive")}
          </span>
        </div>
      </div>
    </header>
  );
}

function SettingsNav({
  activeSection,
  onSectionChange,
  sections,
  t,
}: {
  activeSection: SectionKey;
  onSectionChange: (section: SectionKey) => void;
  sections: ReturnType<typeof getVisibleSections>;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <aside className="h-fit rounded-2xl border border-gray-100 bg-white p-2 shadow-sm shadow-gray-100/60 md:sticky md:top-0">
      <nav
        className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden md:flex-col md:overflow-visible"
        aria-label={t("navLabel")}
      >
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.key;

          return (
            <button
              key={section.key}
              type="button"
              onClick={() => onSectionChange(section.key)}
              className={cn(
                "flex h-10 min-w-36 items-center gap-2 rounded-lg px-3 text-start text-sm font-medium transition md:min-w-0",
                isActive
                  ? "bg-brand-primary text-white shadow-sm shadow-brand-primary/20"
                  : "text-gray-400 hover:bg-gray-50 hover:text-brand-black",
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{t(`tabs.${section.key}`)}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

function SettingsDrawers({
  activeBranchId,
  activeDrawer,
  branches,
  onClose,
  profile,
  t,
  user,
}: {
  activeBranchId: string | null;
  activeDrawer: DrawerKey;
  branches: OrganizationBranch[];
  onClose: () => void;
  profile: ReturnType<typeof getActiveProfile>;
  t: ReturnType<typeof useTranslations>;
  user: NonNullable<ReturnType<typeof useCurrentUser>["data"]>;
}) {
  return (
    <>
      <SettingsDrawer
        description={t("profile.drawerDescription")}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
        open={activeDrawer === "profile"}
        title={t("profile.edit")}
      >
        <ProfileForm
          activeDrawer={activeDrawer}
          cancelLabel={t("cancel")}
          onDone={onClose}
          profile={profile}
          t={t}
          user={user}
        />
      </SettingsDrawer>

      <SettingsDrawer
        description={t("organization.editDrawerDescription")}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
        open={activeDrawer === "organizationEdit"}
        title={t("organization.edit")}
      >
        <OrganizationForm
          activeDrawer={activeDrawer}
          cancelLabel={t("cancel")}
          onDone={onClose}
          profile={profile}
          t={t}
          user={user}
        />
      </SettingsDrawer>

      <SettingsDrawer
        description={
          activeDrawer === "branchEdit"
            ? t("branches.editDrawerDescription")
            : t("branches.drawerDescription")
        }
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
        open={activeDrawer === "branchCreate" || activeDrawer === "branchEdit"}
        title={
          activeDrawer === "branchEdit" ? t("branches.edit") : t("branches.add")
        }
      >
        <BranchForm
          activeDrawer={activeDrawer}
          branches={branches}
          branchId={activeBranchId ?? undefined}
          cancelLabel={t("cancel")}
          onDone={onClose}
          profile={profile}
          t={t}
          user={user}
        />
      </SettingsDrawer>
    </>
  );
}
