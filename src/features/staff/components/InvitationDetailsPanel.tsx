"use client";

import { Mail, RefreshCw, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Dialog } from "radix-ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { STAFF_INVITE_DAY_LABELS } from "../lib/staff-invite.schemas";
import type { ApiStaffInvitation } from "../types/staff.api.types";
import {
  formatDate,
  getExpiresAt,
  getFullName,
  getInvitedAt,
  getRoleLabel,
  getStatus,
  StatusBadge,
} from "./InvitationsTable";

// ─── Helpers private to this panel ───────────────────────────────────────────

const FULL_DAY_TO_SHORT: Record<string, string> = {
  MONDAY: "MON",
  TUESDAY: "TUE",
  WEDNESDAY: "WED",
  THURSDAY: "THU",
  FRIDAY: "FRI",
  SATURDAY: "SAT",
  SUNDAY: "SUN",
};

function formatScheduleDay(
  dayOfWeek: string,
  shifts: Array<{ start_time: string; end_time: string }>,
) {
  const short = FULL_DAY_TO_SHORT[dayOfWeek] ?? dayOfWeek;
  const label =
    STAFF_INVITE_DAY_LABELS[short as keyof typeof STAFF_INVITE_DAY_LABELS] ??
    short;
  const shiftStr = shifts
    .map((s) => `${s.start_time} - ${s.end_time}`)
    .join(", ");
  return `${label}: ${shiftStr}`;
}

function getScheduleLabel(invitation: ApiStaffInvitation) {
  if (invitation.working_schedule) {
    return (
      invitation.working_schedule
        .flatMap((entry) => entry.days)
        .map((day) => formatScheduleDay(day.day_of_week, day.shifts))
        .join("\n") || undefined
    );
  }

  return (
    invitation.branches
      ?.flatMap((branch) => branch.schedule?.days ?? [])
      .map((day) => formatScheduleDay(day.day_of_week, day.shifts))
      .join("\n") || undefined
  );
}

function getBranchLabel(
  branch: NonNullable<ApiStaffInvitation["branches"]>[number],
) {
  if (branch.name) return branch.name;
  if (branch.branch_name) return branch.branch_name;
  if (branch.branch?.name) return branch.branch.name;

  return [
    branch.city ?? branch.branch?.city,
    branch.governorate ?? branch.branch?.governorate,
    branch.branch?.address,
    branch.branch?.country,
  ]
    .filter(Boolean)
    .join(", ");
}

function getInviterLabel(invitation: ApiStaffInvitation) {
  const inviter =
    invitation.invited_by ?? invitation.inviter ?? invitation.created_by;
  if (!inviter) return "-";

  const name = [inviter.first_name, inviter.last_name]
    .filter(Boolean)
    .join(" ");
  return name || inviter.email || "-";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

export function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-1 whitespace-pre-line text-sm font-medium text-brand-black">
        {value || "-"}
      </p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export type InvitationDetailsPanelProps = {
  invitation: ApiStaffInvitation | null;
  isDeleting: boolean;
  isLoading: boolean;
  isOpen: boolean;
  isResending: boolean;
  onDelete: (invitation: ApiStaffInvitation) => void;
  onOpenChange: (open: boolean) => void;
  onResend: (invitation: ApiStaffInvitation) => void;
};

export default function InvitationDetailsPanel({
  invitation,
  isDeleting,
  isLoading,
  isOpen,
  isResending,
  onDelete,
  onOpenChange,
  onResend,
}: InvitationDetailsPanelProps) {
  const t = useTranslations("staff.invitations");
  const staffT = useTranslations("staff");

  const fullName = invitation ? getFullName(invitation) : "";
  const branchLabels =
    invitation?.branches?.map(getBranchLabel).filter(Boolean) ?? [];
  const schedule = invitation ? getScheduleLabel(invitation) : "";

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/35" />
        <Dialog.Content
          className={cn(
            "fixed inset-0 z-50 flex h-dvh w-full flex-col bg-white px-5 py-5 shadow-2xl outline-none",
            "sm:inset-y-0 sm:start-auto sm:inset-e-0 sm:w-107.5 sm:max-w-[calc(100vw-2rem)]",
            "sm:ltr:rounded-l-2xl sm:rtl:rounded-r-2xl",
          )}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <Dialog.Title className="text-lg font-medium text-brand-black">
                {t("detailsTitle")}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-xs text-gray-400">
                {t("detailsDescription")}
              </Dialog.Description>
            </div>
            <Dialog.Close
              className="inline-flex size-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-brand-black"
              aria-label={t("closeDetails")}
            >
              <X className="size-5" aria-hidden="true" />
            </Dialog.Close>
          </div>

          <div className="mt-6 min-h-0 flex-1 overflow-y-auto pe-1">
            {isLoading ? (
              <div className="space-y-3">
                <div className="h-20 animate-pulse rounded-xl bg-gray-50" />
                <div className="h-40 animate-pulse rounded-xl bg-gray-50" />
                <div className="h-24 animate-pulse rounded-xl bg-gray-50" />
              </div>
            ) : invitation ? (
              <div className="space-y-5">
                <section className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-primary/8 text-brand-primary">
                      <Mail className="size-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-brand-black">
                        {fullName || t("unnamedInvitee")}
                      </p>
                      <p className="mt-1 truncate text-sm text-gray-500">
                        {invitation.email ?? "-"}
                      </p>
                      <div className="mt-3">
                        <StatusBadge status={getStatus(invitation)} />
                      </div>
                    </div>
                  </div>
                </section>

                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <DetailRow
                    label={t("fields.role")}
                    value={getRoleLabel(invitation, staffT)}
                  />
                  <DetailRow
                    label={t("fields.jobTitle")}
                    value={invitation.job_title ?? undefined}
                  />
                  <DetailRow
                    label={t("fields.phone")}
                    value={
                      invitation.phone_number ?? invitation.phone ?? undefined
                    }
                  />
                  <DetailRow
                    label={t("fields.specialty")}
                    value={invitation.specialty ?? undefined}
                  />
                  <DetailRow
                    label={t("fields.invitedAt")}
                    value={formatDate(getInvitedAt(invitation))}
                  />
                  <DetailRow
                    label={t("fields.expiresAt")}
                    value={formatDate(getExpiresAt(invitation))}
                  />
                  <DetailRow
                    label={t("fields.acceptedAt")}
                    value={formatDate(invitation.accepted_at ?? undefined)}
                  />
                  <DetailRow
                    label={t("fields.invitedBy")}
                    value={getInviterLabel(invitation)}
                  />
                </section>

                <section className="space-y-4 rounded-xl border border-gray-100 p-4">
                  <DetailRow
                    label={t("fields.branches")}
                    value={
                      branchLabels.length > 0
                        ? branchLabels.join(" | ")
                        : undefined
                    }
                  />
                  <DetailRow label={t("fields.schedule")} value={schedule} />
                </section>
              </div>
            ) : (
              <div className="flex min-h-60 items-center justify-center text-sm text-gray-400">
                {t("selectInvitation")}
              </div>
            )}
          </div>

          {invitation && (
            <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onResend(invitation)}
                disabled={isResending}
              >
                <RefreshCw
                  className={cn("size-4", isResending && "animate-spin")}
                  aria-hidden="true"
                />
                {isResending ? t("resending") : t("resend")}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => onDelete(invitation)}
                disabled={isDeleting}
              >
                <Trash2 className="size-4" aria-hidden="true" />
                {isDeleting ? t("deleting") : t("delete")}
              </Button>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
