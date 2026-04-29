"use client";

import type { ReactNode } from "react";
import { Pencil, ShieldCheck, UserX } from "lucide-react";
import { useTranslations } from "next-intl";
import { getRoleTranslationKey, getStaffFullName } from "../lib/staff.utils";
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
  currentUserStaffId?: string;
  member: StaffMember | null;
  onDeactivate?: (member: StaffMember) => void;
  onEdit?: (member: StaffMember) => void;
};

export function StaffOverview({ currentUserStaffId, member, onDeactivate, onEdit }: Props) {
  const t = useTranslations("staff.overview");
  const staffT = useTranslations("staff");

  if (!member) {
    return (
      <div className="w-64 shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-3 py-10">
        <span className="size-12 rounded-full bg-brand-primary/8 flex items-center justify-center">
          <ShieldCheck
            className="size-5 text-brand-primary/40"
            strokeWidth={1.5}
          />
        </span>
        <p className="text-sm text-gray-400">{t("title")}</p>
      </div>
    );
  }

  const fullName = getStaffFullName(member);
  const isSelf = !!currentUserStaffId && member.id === currentUserStaffId;

  return (
    <aside className="w-full shrink-0 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm lg:w-72">
      <p className="px-4 py-3 text-lg font-medium text-brand-black border-b border-gray-100 text-center">
        {t("title")}
      </p>

      <div className="relative bg-brand-primary px-4 py-6 flex flex-col items-center gap-3 overflow-hidden rounded-b-2xl">
        <span className="pointer-events-none absolute -top-6 -right-6 size-28 rounded-full bg-white/5" />
        <span className="pointer-events-none absolute -bottom-10 -left-8 size-36 rounded-full bg-white/5" />

        <div className="text-center z-10">
          <p className="text-sm font-semibold text-white leading-tight">
            {fullName}
          </p>
          <p className="text-xs text-white/55 mt-0.5">{member.handle}</p>
        </div>

        <StaffStatusBadge status={member.status} variant="pill" />
      </div>

      <div className="px-4 py-1 flex-1">
        <div className="flex items-center justify-center gap-2 border-b border-gray-100 py-3">
          <button
            type="button"
            onClick={() => onEdit?.(member)}
            className="inline-flex size-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-brand-primary/8 hover:text-brand-primary"
            aria-label={t("actions.edit")}
          >
            <Pencil className="size-4" aria-hidden="true" />
          </button>
          {!isSelf && (
            <button
              type="button"
              onClick={() => onDeactivate?.(member)}
              className="inline-flex size-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
              aria-label={t("actions.deactivate")}
            >
              <UserX className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
        <DetailRow
          label={t("role")}
          value={staffT(getRoleTranslationKey(member.role))}
        />
        <DetailRow label={t("jobTitle")} value={member.jobTitle} />
        <DetailRow label={t("specialty")} value={member.specialty || "-"} />
        <DetailRow label={t("phoneNumber")} value={member.phone} />
        {member.address && (
          <DetailRow label={t("address")} value={member.address} />
        )}
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
