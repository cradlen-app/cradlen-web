"use client";

import type { useTranslations } from "next-intl";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { getActiveProfile } from "@/features/auth/lib/current-user";
import { cn } from "@/common/utils/utils";
import type { OrganizationBranch } from "../lib/settings.api";
import { BranchForm, OrganizationForm, ProfileForm } from "./settings-forms";
import {
  getVisibleSections,
  type DrawerKey,
  type SectionKey,
} from "./settings.types";
import { SettingsDrawer } from "./settings-ui";

export function SettingsHeader({
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

export function SettingsNav({
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
    <nav
      className="flex gap-1 overflow-x-auto border-b border-gray-200 [&::-webkit-scrollbar]:hidden"
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
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition",
              isActive
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-gray-400 hover:text-brand-black",
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="whitespace-nowrap">{t(`tabs.${section.key}`)}</span>
          </button>
        );
      })}
    </nav>
  );
}

export function SettingsDrawers({
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
