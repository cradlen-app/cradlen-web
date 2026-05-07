"use client";

import {
  Eye,
  RefreshCw,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  getRoleTranslationKey,
  normalizeApiRoleName,
} from "../lib/staff.utils";
import type { ApiStaffInvitation } from "../types/staff.api.types";
import { cn } from "@/lib/utils";

// ─── Shared helpers (also used by InvitationDetailsPanel) ────────────────────

export function formatDate(value?: string) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(date);
}

export function getFullName(invitation: ApiStaffInvitation) {
  return [invitation.first_name, invitation.last_name]
    .filter(Boolean)
    .join(" ");
}

export function getInvitedAt(invitation: ApiStaffInvitation) {
  return invitation.invited_at ?? invitation.sent_at ?? invitation.created_at;
}

export function getExpiresAt(invitation: ApiStaffInvitation) {
  return invitation.expires_at ?? invitation.expired_at;
}

export function getStatus(invitation: ApiStaffInvitation) {
  const status = invitation.status?.toLowerCase();

  if (status) return status;
  if (invitation.accepted_at) return "accepted";

  const expiresAt = getExpiresAt(invitation);
  if (expiresAt && new Date(expiresAt).getTime() < Date.now()) {
    return "expired";
  }

  return "pending";
}

export function getStatusTranslationKey(status: string) {
  if (status === "canceled" || status === "revoked") return "cancelled";
  if (
    status === "pending" ||
    status === "accepted" ||
    status === "expired" ||
    status === "cancelled"
  ) {
    return status;
  }

  return "unknown";
}

export function humanizeStatus(status: string) {
  return status
    .split(/[_-\s]+/)
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join(" ");
}

export function getRoleLabel(
  invitation: ApiStaffInvitation,
  t: ReturnType<typeof useTranslations>,
) {
  const raw =
    invitation.role?.name ??
    invitation.roles?.[0]?.name ??
    invitation.role_name;
  if (!raw) return "-";

  const normalized = normalizeApiRoleName(raw);
  return raw === normalized || raw === "receptionist"
    ? t(getRoleTranslationKey(normalized))
    : raw;
}

// ─── Components ──────────────────────────────────────────────────────────────

export function StatusBadge({ status }: { status: string }) {
  const t = useTranslations("staff.invitations.status");
  const key = getStatusTranslationKey(status);
  const label = key === "unknown" ? humanizeStatus(status) : t(key);

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium",
        key === "accepted" && "bg-emerald-50 text-emerald-600",
        key === "pending" && "bg-amber-50 text-amber-600",
        key === "expired" && "bg-gray-100 text-gray-500",
        key === "cancelled" && "bg-red-50 text-red-500",
        key === "unknown" && "bg-gray-100 text-gray-500",
      )}
    >
      {label}
    </span>
  );
}

export function TableSkeleton() {
  return (
    <div className="overflow-x-auto bg-white px-4">
      <div className="h-10 border-b border-gray-100" />
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 border-b border-gray-50 py-3 last:border-0"
        >
          <div className="size-9 animate-pulse rounded-full bg-gray-100" />
          <div className="flex flex-1 flex-col gap-1.5">
            <div className="h-3 w-36 animate-pulse rounded bg-gray-100" />
            <div className="h-2.5 w-48 animate-pulse rounded bg-gray-50" />
          </div>
          <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
          <div className="h-4 w-18 animate-pulse rounded-full bg-gray-100" />
          <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

const columns = [
  "invitee",
  "role",
  "status",
  "invited",
  "expires",
  "actions",
] as const;

export type InvitationsTableProps = {
  invitations: ApiStaffInvitation[];
  onDelete: (invitation: ApiStaffInvitation) => void;
  onResend: (invitation: ApiStaffInvitation) => void;
  onSelect: (invitation: ApiStaffInvitation) => void;
  resendingId: string | null;
  selectedId: string | null;
};

export default function InvitationsTable({
  invitations,
  onDelete,
  onResend,
  onSelect,
  resendingId,
  selectedId,
}: InvitationsTableProps) {
  const t = useTranslations("staff.invitations");
  const staffT = useTranslations("staff");

  if (invitations.length === 0) {
    return (
      <div className="flex min-h-60 items-center justify-center bg-white px-4 text-sm text-gray-400">
        {t("noResults")}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white px-4">
      <table className="w-full min-w-220 text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {columns.map((column) => (
              <th
                key={column}
                className="pb-3 pt-4 pe-4 text-start text-xs font-medium text-gray-400 last:pe-0"
              >
                {t(`columns.${column}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {invitations.map((invitation) => {
            const fullName = getFullName(invitation) || t("unnamedInvitee");
            const status = getStatus(invitation);
            const isSelected = selectedId === invitation.id;
            const isResending = resendingId === invitation.id;

            return (
              <tr
                key={invitation.id}
                onClick={() => onSelect(invitation)}
                aria-selected={isSelected}
                className={cn(
                  "cursor-pointer border-b border-gray-50 transition-colors last:border-0",
                  isSelected ? "bg-brand-primary/5" : "hover:bg-gray-50",
                )}
              >
                <td className="py-3 pe-4">
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-primary/8 text-brand-primary">
                      <UserPlus className="size-4" aria-hidden="true" />
                    </span>
                    <div className="flex min-w-0 flex-col leading-tight">
                      <span className="truncate text-brand-black">
                        {fullName}
                      </span>
                      <span className="truncate text-xs font-thin text-gray-400">
                        {invitation.email ?? "-"}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="py-3 pe-4">
                  <div className="flex flex-col leading-tight">
                    <span className="text-brand-black">
                      {getRoleLabel(invitation, staffT)}
                    </span>
                    <span className="text-xs font-thin italic text-gray-400">
                      {invitation.job_title || "-"}
                    </span>
                  </div>
                </td>
                <td className="py-3 pe-4">
                  <StatusBadge status={status} />
                </td>
                <td className="py-3 pe-4 text-brand-black">
                  {formatDate(getInvitedAt(invitation))}
                </td>
                <td className="py-3 pe-4 text-brand-black">
                  {formatDate(getExpiresAt(invitation))}
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelect(invitation);
                      }}
                      className="inline-flex size-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-50 hover:text-brand-black"
                      aria-label={t("view")}
                    >
                      <Eye className="size-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onResend(invitation);
                      }}
                      disabled={isResending}
                      className="inline-flex size-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-50 hover:text-brand-primary disabled:opacity-50"
                      aria-label={t("resend")}
                    >
                      <RefreshCw
                        className={cn("size-4", isResending && "animate-spin")}
                        aria-hidden="true"
                      />
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDelete(invitation);
                      }}
                      className="inline-flex size-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                      aria-label={t("delete")}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
