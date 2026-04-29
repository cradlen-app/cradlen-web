"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  CURRENT_USER_QUERY_KEY,
  useCurrentUser,
} from "@/features/auth/hooks/useCurrentUser";
import { getActiveProfile } from "@/features/auth/lib/current-user";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useUserStore } from "@/features/auth/store/userStore";
import { useRouter } from "@/i18n/navigation";
import { queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import {
  deactivateAccount,
  deleteBranch,
  deleteOrganization,
} from "../lib/settings.api";
import { SettingsConfirmDialogs } from "./settings-dialogs";
import { BranchForm, OrganizationForm, ProfileForm } from "./settings-forms";
import {
  BranchesSection,
  DangerSection,
  OrganizationSection,
  ProfileSection,
} from "./settings-sections";
import {
  SETTINGS_SECTIONS,
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
  const [activeSection, setActiveSection] = useState<SectionKey>("profile");
  const [activeDrawer, setActiveDrawer] = useState<DrawerKey>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [confirmSoftDelete, setConfirmSoftDelete] =
    useState<SoftDeleteKey>(null);
  const { data: user, isError, isLoading } = useCurrentUser();
  const clearSession = useAuthStore((state) => state.clearSession);
  const clearUser = useUserStore((state) => state.clearUser);
  const profile = getActiveProfile(user);

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
  const branchAddress = profile?.branch
    ? [
        profile.branch.address,
        profile.branch.city,
        profile.branch.governorate,
        profile.branch.country,
      ]
        .filter(Boolean)
        .join(", ")
    : "";

  async function handleSoftDeleteConfirm() {
    try {
      if (confirmSoftDelete === "organization") {
        if (!profile?.organization.id) return;
        await deleteOrganization(profile.organization.id);
        toast.success(t("organization.deleteSuccess"));
      }

      if (confirmSoftDelete === "branch") {
        if (!profile?.branch.id || !profile.organization.id) return;
        await deleteBranch(profile.branch.id, profile.organization.id);
        toast.success(t("branches.deleteSuccess"));
      }

      setConfirmSoftDelete(null);
      await queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
    } catch {
      toast.error(
        confirmSoftDelete === "organization"
          ? t("organization.deleteError")
          : t("branches.deleteError"),
      );
    }
  }

  async function handleDeactivateConfirm() {
    try {
      await deactivateAccount();
      toast.success(t("danger.deactivateSuccess"));
      setConfirmDeactivate(false);

      try {
        await fetch("/api/auth/logout", { method: "POST" });
      } catch {
        // Continue with local session cleanup after account deactivation.
      }

      clearSession();
      clearUser();
      queryClient.clear();
      router.replace("/sign-in");
    } catch {
      toast.error(t("danger.deactivateError"));
    }
  }

  const sectionProps = {
    branchAddress,
    displayName,
    locale,
    profile,
    setActiveDrawer,
    setConfirmDeactivate,
    setConfirmSoftDelete,
    t,
    user,
  };

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4 lg:p-6">
      <SettingsHeader
        active={user.is_active}
        roleLabel={formatRole(profile?.role.name, t)}
        t={t}
      />

      <div className="grid min-h-0 gap-4 lg:grid-cols-[16rem_1fr]">
        <SettingsNav
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          t={t}
        />

        <div className="min-w-0">
          {activeSection === "profile" && <ProfileSection {...sectionProps} />}
          {activeSection === "organization" && (
            <OrganizationSection {...sectionProps} />
          )}
          {activeSection === "branches" && (
            <BranchesSection {...sectionProps} />
          )}
          {activeSection === "danger" && <DangerSection {...sectionProps} />}
        </div>
      </div>

      <SettingsDrawers
        activeDrawer={activeDrawer}
        onClose={() => setActiveDrawer(null)}
        profile={profile}
        t={t}
        user={user}
      />

      <SettingsConfirmDialogs
        cancelLabel={t("cancel")}
        confirmDeactivate={confirmDeactivate}
        confirmSoftDelete={confirmSoftDelete}
        onDeactivateChange={setConfirmDeactivate}
        onDeactivateConfirm={handleDeactivateConfirm}
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
  t,
}: {
  activeSection: SectionKey;
  onSectionChange: (section: SectionKey) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <aside className="h-fit rounded-2xl border border-gray-100 bg-white p-2 shadow-sm shadow-gray-100/60 lg:sticky lg:top-0">
      <nav
        className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible"
        aria-label={t("navLabel")}
      >
        {SETTINGS_SECTIONS.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.key;

          return (
            <button
              key={section.key}
              type="button"
              onClick={() => onSectionChange(section.key)}
              className={cn(
                "flex h-10 min-w-36 items-center gap-2 rounded-lg px-3 text-start text-sm font-medium transition lg:min-w-0",
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
  activeDrawer,
  onClose,
  profile,
  t,
  user,
}: {
  activeDrawer: DrawerKey;
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
        description={
          activeDrawer === "organizationEdit"
            ? t("organization.editDrawerDescription")
            : t("organization.drawerDescription")
        }
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
        open={
          activeDrawer === "organizationCreate" ||
          activeDrawer === "organizationEdit"
        }
        title={
          activeDrawer === "organizationEdit"
            ? t("organization.edit")
            : t("organization.add")
        }
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
