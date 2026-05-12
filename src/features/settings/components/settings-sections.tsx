import {
  AlertTriangle,
  Building2,
  KeyRound,
  MapPin,
  Pencil,
  Plus,
  ShieldAlert,
  Trash2,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import {
  getProfilePrimaryRole,
  getProfileSpecialtyNames,
} from "@/features/auth/lib/current-user";
import type { OrganizationBranch } from "@/features/settings/lib/settings.api";
import type { CurrentUser, UserProfile } from "@/common/types/user.types";
import type { DrawerKey, SoftDeleteKey } from "./settings.types";
import {
  formatEngagementType,
  formatExecutiveTitle,
  formatOrgStatus,
  formatRole,
  formatSettingsDateTime,
  type SettingsLocale,
  type SettingsT,
} from "./settings.utils";
import {
  DetailRow,
  EmptyState,
  EntitySummary,
  SectionPanel,
} from "./settings-ui";

type SectionProps = {
  branches: OrganizationBranch[];
  branchesLoading?: boolean;
  currentBranchId?: string | null;
  displayName: string;
  locale: SettingsLocale;
  profile?: UserProfile;
  setActiveDrawer: (drawer: DrawerKey) => void;
  setActiveBranchId: (branchId: string | null) => void;
  setConfirmSoftDelete: (target: SoftDeleteKey) => void;
  t: SettingsT;
  user: CurrentUser;
};

export function ProfileSection({
  displayName,
  locale,
  profile,
  setActiveDrawer,
  t,
  user,
}: SectionProps) {
  return (
    <SectionPanel
      description={t("profile.description")}
      icon={<UserRound className="size-5" />}
      title={t("profile.title")}
    >
      {!profile ? (
        <EmptyState
          description={t("empty.profileDescription")}
          title={t("empty.profileTitle")}
        />
      ) : (
        <>
          <EntitySummary
            actions={
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveDrawer("profile")}
              >
                <Pencil className="size-4" />
                {t("profile.edit")}
              </Button>
            }
            icon={<UserRound className="size-5" />}
            label={t("profile.title")}
            meta={
              <>
                <span className="rounded-full bg-brand-primary/8 px-2.5 py-1 text-xs font-medium text-brand-primary">
                  {formatRole(getProfilePrimaryRole(profile), t)}
                </span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  {user.is_active ? t("status.active") : t("status.inactive")}
                </span>
              </>
            }
            title={displayName}
            description={user.email}
          />
          <dl className="rounded-xl border border-gray-100 px-3">
            <DetailRow label={t("fields.name")} value={displayName} />
            <DetailRow label={t("fields.email")} value={user.email} />
            <DetailRow
              label={t("fields.phone")}
              value={user.phone_number ?? user.phone ?? undefined}
            />
            <DetailRow
              label={t("fields.role")}
              value={formatRole(getProfilePrimaryRole(profile), t)}
            />
            <DetailRow
              label={t("fields.executiveTitle")}
              value={formatExecutiveTitle(profile.executive_title, t)}
            />
            <DetailRow
              label={t("fields.engagementType")}
              value={formatEngagementType(profile.engagement_type, t)}
            />
            <DetailRow
              label={t("fields.jobFunctions")}
              value={
                profile.job_functions?.map((j) => j.name).join(", ") ||
                t("empty.missing")
              }
            />
            <DetailRow
              label={t("fields.specialties")}
              value={
                getProfileSpecialtyNames(profile).join(", ") ||
                t("empty.missing")
              }
            />
            <DetailRow
              label={t("fields.verifiedAt")}
              value={formatSettingsDateTime(user.verified_at, locale)}
            />
          </dl>
        </>
      )}
    </SectionPanel>
  );
}

export function AccountSection({
  user,
  t,
}: Pick<SectionProps, "user" | "t">) {
  return (
    <SectionPanel
      description={t("account.description")}
      icon={<KeyRound className="size-5" />}
      title={t("account.title")}
    >
      <dl className="rounded-xl border border-gray-100 px-3">
        <DetailRow label={t("fields.email")} value={user.email} />
        <DetailRow
          label={t("fields.phone")}
          value={user.phone_number ?? user.phone ?? undefined}
        />
      </dl>
      <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50/40 p-4">
        <h3 className="text-sm font-medium text-brand-black">
          {t("account.password")}
        </h3>
        <p className="mt-1 text-xs text-gray-500">
          {t("account.passwordHint")}
        </p>
        <Link
          href="/forgot-password"
          className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-brand-black hover:bg-gray-50"
        >
          {t("account.changePassword")}
        </Link>
      </div>
    </SectionPanel>
  );
}

export function OrganizationSection({
  profile,
  setActiveDrawer,
  t,
}: SectionProps) {
  return (
    <SectionPanel
      action={
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/create-organization"
            className="inline-flex items-center gap-1.5 rounded-md bg-brand-primary px-3 py-2 text-sm font-medium text-white hover:bg-brand-primary/90"
          >
            <Plus className="size-4" />
            {t("organization.add")}
          </Link>
        </div>
      }
      description={t("organization.description")}
      icon={<Building2 className="size-5" />}
      title={t("organization.title")}
    >
      {!profile?.organization ? (
        <EmptyState
          description={t("empty.organizationDescription")}
          title={t("empty.organizationTitle")}
        />
      ) : (
        <EntitySummary
          actions={
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveDrawer("organizationEdit")}
            >
              <Pencil className="size-4" />
              {t("organization.edit")}
            </Button>
          }
          icon={<Building2 className="size-5" />}
          label={t("fields.organization")}
          meta={
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-500">
              {formatOrgStatus(profile.organization.status, t)}
            </span>
          }
          title={profile.organization.name}
        />
      )}
    </SectionPanel>
  );
}

export function BranchesSection({
  branches,
  branchesLoading,
  currentBranchId,
  profile,
  setActiveDrawer,
  setActiveBranchId,
  setConfirmSoftDelete,
  t,
}: SectionProps) {
  function branchAddress(branch: OrganizationBranch) {
    return [branch.address, branch.city, branch.governorate, branch.country]
      .filter(Boolean)
      .join(", ");
  }

  return (
    <SectionPanel
      action={
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            className="bg-brand-primary text-white hover:bg-brand-primary/90"
            onClick={() => setActiveDrawer("branchCreate")}
            disabled={!profile?.organization.id}
          >
            <Plus className="size-4" />
            {t("branches.add")}
          </Button>
        </div>
      }
      description={t("branches.description")}
      icon={<MapPin className="size-5" />}
      title={t("branches.title")}
    >
      {branchesLoading ? (
        <div className="py-6 text-center text-sm text-gray-400">
          {t("loading")}
        </div>
      ) : branches.length === 0 ? (
        <EmptyState
          description={t("empty.branchDescription")}
          title={t("empty.branchTitle")}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {branches.map((branch) => (
            <EntitySummary
              key={branch.id}
              actions={
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setActiveBranchId(branch.id);
                      setActiveDrawer("branchEdit");
                    }}
                  >
                    <Pencil className="size-4" />
                    {t("branches.edit")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="text-red-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                    onClick={() =>
                      setConfirmSoftDelete({ type: "branch", branchId: branch.id })
                    }
                  >
                    <Trash2 className="size-4" />
                    {t("branches.delete")}
                  </Button>
                </div>
              }
              icon={<MapPin className="size-5" />}
              label={branch.id === currentBranchId ? t("fields.currentBranch") : undefined}
              meta={
                branch.is_main ? (
                  <span className="rounded-full bg-brand-primary/8 px-2.5 py-1 text-xs font-medium text-brand-primary">
                    {t("fields.mainBranch")}
                  </span>
                ) : undefined
              }
              title={branch.name || branch.city || t("empty.branchTitle")}
              description={branchAddress(branch)}
            />
          ))}
        </div>
      )}
    </SectionPanel>
  );
}

export function DangerSection({
  setConfirmSoftDelete,
  t,
}: SectionProps) {
  return (
    <SectionPanel
      description={t("danger.description")}
      icon={<ShieldAlert className="size-5" />}
      title={t("danger.title")}
    >
      <div className="flex flex-col gap-4 rounded-xl border border-red-100 bg-red-50/60 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 gap-3">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-500" />
          <div>
            <h3 className="text-sm font-medium text-red-700">
              {t("danger.deleteTitle")}
            </h3>
            <p className="mt-1 text-sm text-red-500">
              {t("danger.deleteDescription")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="destructive"
            onClick={() => setConfirmSoftDelete({ type: "organization" })}
          >
            <Trash2 className="size-4" />
            {t("organization.delete")}
          </Button>
        </div>
      </div>
    </SectionPanel>
  );
}
