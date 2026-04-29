import {
  AlertTriangle,
  Building2,
  MapPin,
  Pencil,
  Plus,
  ShieldAlert,
  Trash2,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CurrentUser, UserProfile } from "@/types/user.types";
import type { DrawerKey, SoftDeleteKey } from "./settings.types";
import {
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
  branchAddress: string;
  displayName: string;
  locale: SettingsLocale;
  profile?: UserProfile;
  setActiveDrawer: (drawer: DrawerKey) => void;
  setConfirmDeactivate: (open: boolean) => void;
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
                  {formatRole(profile.role.name, t)}
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
              value={user.phone_number ?? user.phone}
            />
            <DetailRow
              label={t("fields.role")}
              value={formatRole(profile.role.name, t)}
            />
            <DetailRow
              label={t("fields.jobTitle")}
              value={profile.job_title}
            />
            {(profile.role.name === "doctor" ||
              (profile.organization?.specialities?.length ?? 0) > 0) && (
              <DetailRow
                label={t("fields.specialty")}
                value={profile.specialty}
              />
            )}
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

export function OrganizationSection({
  profile,
  setActiveDrawer,
  setConfirmSoftDelete,
  t,
}: SectionProps) {
  return (
    <SectionPanel
      action={
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            className="bg-brand-primary text-white hover:bg-brand-primary/90"
            onClick={() => setActiveDrawer("organizationCreate")}
          >
            <Plus className="size-4" />
            {t("organization.add")}
          </Button>
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
        <>
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
                {profile.organization.status || t("empty.missing")}
              </span>
            }
            title={profile.organization.name}
            description={profile.organization.specialities?.join(", ")}
          />
          <SoftDeletePanel
            description={t("organization.DeleteDescription")}
            label={t("organization.Delete")}
            onClick={() => setConfirmSoftDelete("organization")}
          />
        </>
      )}
    </SectionPanel>
  );
}

export function BranchesSection({
  branchAddress,
  profile,
  setActiveDrawer,
  setConfirmSoftDelete,
  t,
}: SectionProps) {
  return (
    <SectionPanel
      action={
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            className="bg-brand-primary text-white hover:bg-brand-primary/90"
            onClick={() => setActiveDrawer("branchCreate")}
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
      {!profile?.branch ? (
        <EmptyState
          description={t("empty.branchDescription")}
          title={t("empty.branchTitle")}
        />
      ) : (
        <>
          <EntitySummary
            actions={
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveDrawer("branchEdit")}
              >
                <Pencil className="size-4" />
                {t("branches.edit")}
              </Button>
            }
            icon={<MapPin className="size-5" />}
            label={t("fields.currentBranch")}
            meta={
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-500">
                {profile.branch.is_main
                  ? t("fields.mainBranch")
                  : t("empty.missing")}
              </span>
            }
            title={profile.branch.city || t("empty.branchTitle")}
            description={branchAddress}
          />
          <SoftDeletePanel
            description={t("branches.DeleteDescription")}
            label={t("branches.Delete")}
            onClick={() => setConfirmSoftDelete("branch")}
          />
        </>
      )}
    </SectionPanel>
  );
}

export function DangerSection({
  setConfirmDeactivate,
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
              {t("danger.deactivateTitle")}
            </h3>
            <p className="mt-1 text-sm text-red-500">
              {t("danger.deactivateDescription")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="destructive"
            onClick={() => setConfirmDeactivate(true)}
          >
            {t("danger.deactivate")}
          </Button>
        </div>
      </div>
    </SectionPanel>
  );
}

function SoftDeletePanel({
  description,
  label,
  onClick,
}: {
  description: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <div className="mt-4 rounded-xl border border-red-100 bg-red-50/50 p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-red-700">{label}</p>
          <p className="mt-1 text-xs text-red-500">{description}</p>
        </div>
        <Button type="button" variant="destructive" onClick={onClick}>
          <Trash2 className="size-4" />
          {label}
        </Button>
      </div>
    </div>
  );
}
