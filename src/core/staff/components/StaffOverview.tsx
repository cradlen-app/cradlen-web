"use client";

import type { ReactNode } from "react";
import { LogOut, Pencil, ShieldCheck, UserX } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/common/utils/utils";
import {
  getRoleTranslationKey,
  getStaffFullName,
  getStaffJobFunctionsLabel,
  getStaffSpecialtiesLabel,
} from "../lib/staff.utils";
import type { StaffMember } from "../types/staff.types";
import { StaffStatusBadge } from "./StaffStatusBadge";

type RowProps = {
  label: string;
  value: ReactNode;
};

function DetailRow({ label, value }: RowProps) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 last:border-0">
      <div className="flex flex-1 items-start justify-between gap-2 min-w-0">
        <span className="text-xs text-gray-400 shrink-0 pt-0.5">{label}</span>
        <span className="text-xs font-medium text-brand-black text-end leading-relaxed">
          {value}
        </span>
      </div>
    </div>
  );
}

type Props = {
  canManage?: boolean;
  /** Only OWNER may delete an entire staff profile. */
  canDelete?: boolean;
  /** When set, shows a "Remove from this branch" action. */
  currentBranchId?: string;
  currentUserStaffId?: string;
  member: StaffMember | null;
  onDeactivate?: (member: StaffMember) => void;
  onEdit?: (member: StaffMember) => void;
  onUnassignFromBranch?: (member: StaffMember) => void;
  className?: string;
  emptyClassName?: string;
};

export function StaffOverview({
  canManage,
  canDelete,
  currentBranchId,
  currentUserStaffId,
  member,
  onDeactivate,
  onEdit,
  onUnassignFromBranch,
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

  const fullName = getStaffFullName(member);
  const isSelf = !!currentUserStaffId && member.id === currentUserStaffId;
  const showDelete = canManage && canDelete && !isSelf;
  const memberAssignedToCurrentBranch =
    !!currentBranchId && member.branches.some((b) => b.id === currentBranchId);
  const showUnassign =
    canManage && !isSelf && !!onUnassignFromBranch && memberAssignedToCurrentBranch;
  const jobFunctionsLabel = getStaffJobFunctionsLabel(member);
  const specialtiesLabel = getStaffSpecialtiesLabel(member);

  return (
    <aside
      className={cn(
        "w-full shrink-0 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm lg:w-72",
        className,
      )}
    >
      <p className="px-4 py-3 text-lg font-medium text-brand-black border-b border-gray-100 text-center">
        {t("title")}
      </p>

      <div className="relative bg-brand-primary px-4 py-6 flex flex-col items-center gap-3 overflow-hidden rounded-b-2xl">
        <span className="pointer-events-none absolute -top-6 -right-6 size-28 rounded-full bg-white/5" />
        <span className="pointer-events-none absolute -bottom-10 -left-8 size-36 rounded-full bg-white/5" />

        <div className="text-center z-10">
          <p className="text-sm font-semibold text-white leading-tight">{fullName}</p>
          {member.executiveTitle && (
            <p className="text-[11px] font-medium uppercase tracking-wide text-white/80">
              {member.executiveTitle}
            </p>
          )}
          <p className="text-xs text-white/55 mt-0.5">{member.handle}</p>
        </div>

        <StaffStatusBadge status={member.status} variant="pill" />
      </div>

      <div className="px-4 py-1 flex-1">
        {canManage && (
          <div className="flex items-center justify-center gap-2 border-b border-gray-100 py-3">
            <button
              type="button"
              onClick={() => onEdit?.(member)}
              className="inline-flex size-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-brand-primary/8 hover:text-brand-primary"
              aria-label={t("actions.edit")}
            >
              <Pencil className="size-4" aria-hidden="true" />
            </button>
            {showUnassign && (
              <button
                type="button"
                onClick={() => onUnassignFromBranch?.(member)}
                className="inline-flex size-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-amber-50 hover:text-amber-600"
                aria-label={t("actions.unassign")}
                title={t("actions.unassign")}
              >
                <LogOut className="size-4" aria-hidden="true" />
              </button>
            )}
            {showDelete && (
              <button
                type="button"
                onClick={() => onDeactivate?.(member)}
                className="inline-flex size-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                aria-label={t("actions.deactivate")}
                title={t("actions.deactivate")}
              >
                <UserX className="size-4" aria-hidden="true" />
              </button>
            )}
          </div>
        )}
        <DetailRow
          label={t("role")}
          value={staffT(getRoleTranslationKey(member.role))}
        />
        {member.engagementType && (
          <DetailRow
            label={t("engagement")}
            value={staffT(`engagementTypes.${member.engagementType}`)}
          />
        )}
        <DetailRow
          label={t("jobFunctions")}
          value={jobFunctionsLabel || "-"}
        />
        <DetailRow label={t("specialty")} value={specialtiesLabel || "-"} />
        <DetailRow label={t("phoneNumber")} value={member.phone} />
        {member.workSchedule && (
          <DetailRow
            label={t("workSchedule")}
            value={
              <span className="whitespace-pre-line text-end">
                {member.workSchedule}
              </span>
            }
          />
        )}
      </div>
    </aside>
  );
}
