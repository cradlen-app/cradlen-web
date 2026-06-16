"use client";

import type { ReactNode } from "react";
import {
  Award,
  BadgeCheck,
  Briefcase,
  CalendarDays,
  KeyRound,
  type LucideIcon,
  Pencil,
  Phone,
  ShieldCheck,
  Stethoscope,
  UserCog,
  UserX,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/common/utils/utils";
import { JOB_ROLE } from "@/features/auth/lib/auth.constants";
import {
  getRoleTranslationKey,
  getStaffDisplayName,
  getStaffSpecialtiesLabel,
} from "../lib/staff.utils";
import { deriveJobRoleFromCodes } from "../lib/staff-role-fields";
import type { StaffMember } from "../types/staff.types";
import { StaffAvatar } from "./StaffAvatar";
import { StaffStatusBadge } from "./StaffStatusBadge";

type RowProps = {
  icon?: LucideIcon;
  label: string;
  value: ReactNode;
};

function DetailRow({ icon: Icon, label, value }: RowProps) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-gray-100 last:border-0">
      <div className="flex shrink-0 items-center gap-2 pt-0.5">
        {Icon && (
          <Icon
            className="size-3.5 text-gray-400"
            strokeWidth={1.75}
            aria-hidden="true"
          />
        )}
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <span className="min-w-0 text-xs font-medium text-brand-black text-end leading-relaxed">
        {value}
      </span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="px-4">
      <p className="pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        {title}
      </p>
      {children}
    </div>
  );
}

type Props = {
  canManage?: boolean;
  /** Whether the current user is an OWNER — gates resetting privileged targets. */
  isOwner?: boolean;
  /** The branch in context — the staff member is removed from this branch. */
  currentBranchId?: string;
  currentUserStaffId?: string;
  member: StaffMember | null;
  onEdit?: (member: StaffMember) => void;
  /**
   * Remove the member from the current branch. If it's their last branch the
   * backend soft-deletes the whole profile.
   */
  onRemoveFromBranch?: (member: StaffMember) => void;
  /** Admin-initiated password reset for this staff member. */
  onResetPassword?: (member: StaffMember) => void;
  className?: string;
  emptyClassName?: string;
};

export function StaffOverview({
  canManage,
  isOwner,
  currentBranchId,
  currentUserStaffId,
  member,
  onEdit,
  onRemoveFromBranch,
  onResetPassword,
  className,
  emptyClassName,
}: Props) {
  const t = useTranslations("staff.overview");
  const staffT = useTranslations("staff");

  if (!member) {
    return (
      <div
        className={cn(
          "w-64 shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-3 py-10",
          emptyClassName,
        )}
      >
        <span className="size-12 rounded-full bg-brand-primary/8 flex items-center justify-center">
          <ShieldCheck className="size-5 text-brand-primary/40" strokeWidth={1.5} />
        </span>
        <p className="text-sm text-gray-400">{t("title")}</p>
      </div>
    );
  }

  const displayName = getStaffDisplayName(member, t("unnamed"));
  const isSelf = !!currentUserStaffId && member.id === currentUserStaffId;
  const memberAssignedToCurrentBranch =
    !!currentBranchId && member.branches.some((b) => b.id === currentBranchId);
  const showRemove =
    canManage && !isSelf && !!onRemoveFromBranch && memberAssignedToCurrentBranch;
  // Mirror the backend privileged-target guard: a BRANCH_MANAGER cannot reset
  // an OWNER/BRANCH_MANAGER, so don't show a button that would 403.
  const targetPrivileged =
    member.role === "OWNER" || member.role === "BRANCH_MANAGER";
  const showReset =
    canManage && !!onResetPassword && (isOwner || !targetPrivileged);
  const jobRole = deriveJobRoleFromCodes(
    member.jobFunction ? [member.jobFunction.code] : [],
  );
  const jobRoleLabel =
    jobRole === JOB_ROLE.NONE ? "-" : staffT(`create.jobRoles.${jobRole}`);
  const specialtiesLabel = getStaffSpecialtiesLabel(member);

  return (
    <aside
      className={cn(
        "w-full shrink-0 overflow-hidden rounded-2xl border border-gray-100 bg-white pb-2 shadow-sm lg:w-72",
        className,
      )}
    >
      <p className="px-4 py-3 text-lg font-medium text-brand-black border-b border-gray-100 text-center">
        {t("title")}
      </p>

      <div className="bg-brand-primary px-4 py-6 flex flex-col items-center gap-3 rounded-b-2xl">
        <StaffAvatar
          name={displayName}
          imageUrl={member.imageUrl}
          className="size-16 bg-white/20 text-xl ring-2 ring-white/30"
        />

        <div className="text-center">
          <p className="text-sm font-semibold text-white leading-tight">{displayName}</p>
          {member.executiveTitle && (
            <p className="text-[11px] font-medium uppercase tracking-wide text-white/80">
              {member.executiveTitle}
            </p>
          )}
          <p className="text-xs text-white/55 mt-0.5">{member.handle}</p>
        </div>

        <StaffStatusBadge status={member.status} variant="pill" />
      </div>

      {canManage && (
        <div className="flex items-center justify-center gap-2 border-b border-gray-100 px-4 py-3">
          <button
            type="button"
            onClick={() => onEdit?.(member)}
            className="inline-flex size-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-brand-primary/8 hover:text-brand-primary"
            aria-label={t("actions.edit")}
          >
            <Pencil className="size-4" aria-hidden="true" />
          </button>
          {showReset && (
            <button
              type="button"
              onClick={() => onResetPassword?.(member)}
              className="inline-flex size-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-brand-primary/8 hover:text-brand-primary"
              aria-label={t("actions.resetPassword")}
              title={t("actions.resetPassword")}
            >
              <KeyRound className="size-4" aria-hidden="true" />
            </button>
          )}
          {showRemove && (
            <button
              type="button"
              onClick={() => onRemoveFromBranch?.(member)}
              className="inline-flex size-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
              aria-label={t("actions.remove")}
              title={t("actions.remove")}
            >
              <UserX className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      <Section title={t("sections.roleFunction")}>
        <DetailRow
          icon={UserCog}
          label={t("role")}
          value={staffT(getRoleTranslationKey(member.role))}
        />
        {member.engagementType && (
          <DetailRow
            icon={Briefcase}
            label={t("engagement")}
            value={staffT(`engagementTypes.${member.engagementType}`)}
          />
        )}
        <DetailRow icon={Stethoscope} label={t("jobFunctions")} value={jobRoleLabel} />
        <DetailRow icon={Award} label={t("specialty")} value={specialtiesLabel || "-"} />
        {member.professionalTitle && (
          <DetailRow
            icon={BadgeCheck}
            label={t("professionalTitle")}
            value={member.professionalTitle}
          />
        )}
      </Section>

      <Section title={t("sections.contact")}>
        <DetailRow icon={Phone} label={t("phoneNumber")} value={member.phone} />
      </Section>

      {member.workSchedule && (
        <Section title={t("sections.schedule")}>
          <DetailRow
            icon={CalendarDays}
            label={t("workSchedule")}
            value={
              <span className="whitespace-pre-line text-end">
                {member.workSchedule}
              </span>
            }
          />
        </Section>
      )}
    </aside>
  );
}
