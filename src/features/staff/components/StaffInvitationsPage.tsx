"use client";

import { useMemo, useState } from "react";
import {
  ChevronRight,
  Eye,
  Mail,
  RefreshCw,
  Search,
  Send,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { AlertDialog, Dialog } from "radix-ui";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { getActiveProfile } from "@/features/auth/lib/current-user";
import { Link } from "@/i18n/navigation";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  useDeleteStaffInvitation,
  useResendStaffInvitation,
  useStaffInvitation,
  useStaffInvitations,
} from "../hooks/useStaffInvitations";
import { STAFF_INVITE_DAY_LABELS } from "../lib/staff-invite.schemas";
import {
  getRoleTranslationKey,
  normalizeApiRoleName,
} from "../lib/staff.utils";
import type { ApiStaffInvitation } from "../types/staff.api.types";

type InvitationStatusFilter =
  | "all"
  | "pending"
  | "accepted"
  | "expired"
  | "cancelled";

const STATUS_FILTERS: InvitationStatusFilter[] = [
  "all",
  "pending",
  "accepted",
  "expired",
  "cancelled",
];

const columns = [
  "invitee",
  "role",
  "status",
  "invited",
  "expires",
  "actions",
] as const;

function unwrapApiError(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return error.messages[0] || fallback;
  }

  return fallback;
}

function formatDate(value?: string) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(date);
}

function getFullName(invitation: ApiStaffInvitation) {
  return [invitation.first_name, invitation.last_name]
    .filter(Boolean)
    .join(" ");
}

function getInvitedAt(invitation: ApiStaffInvitation) {
  return invitation.invited_at ?? invitation.sent_at ?? invitation.created_at;
}

function getExpiresAt(invitation: ApiStaffInvitation) {
  return invitation.expires_at ?? invitation.expired_at;
}

function getStatus(invitation: ApiStaffInvitation) {
  const status = invitation.status?.toLowerCase();

  if (status) return status;
  if (invitation.accepted_at) return "accepted";

  const expiresAt = getExpiresAt(invitation);
  if (expiresAt && new Date(expiresAt).getTime() < Date.now()) {
    return "expired";
  }

  return "pending";
}

function getStatusTranslationKey(status: string) {
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

function humanizeStatus(status: string) {
  return status
    .split(/[_-\s]+/)
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join(" ");
}

function getBranchLabel(
  branch: NonNullable<ApiStaffInvitation["branches"]>[number],
) {
  if (branch.branch_name) return branch.branch_name;
  if (branch.branch?.name) return branch.branch.name;

  return [
    branch.branch?.address,
    branch.branch?.city,
    branch.branch?.governorate,
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

function getRoleLabel(
  invitation: ApiStaffInvitation,
  t: ReturnType<typeof useTranslations>,
) {
  const raw = invitation.role?.name ?? invitation.role_name;
  if (!raw) return "-";

  const normalized = normalizeApiRoleName(raw);
  return raw === normalized || raw === "receptionist"
    ? t(getRoleTranslationKey(normalized))
    : raw;
}

function getScheduleLabel(invitation: ApiStaffInvitation) {
  return invitation.branches
    ?.flatMap((branch) => branch.schedule?.days ?? [])
    .map((day) => {
      const shifts = day.shifts
        .map((shift) => `${shift.start_time} - ${shift.end_time}`)
        .join(", ");

      return `${STAFF_INVITE_DAY_LABELS[day.day_of_week]}: ${shifts}`;
    })
    .join("\n");
}

function matchesSearch(invitation: ApiStaffInvitation, search: string) {
  const query = search.trim().toLowerCase();
  if (!query) return true;

  return [
    getFullName(invitation),
    invitation.email,
    invitation.phone,
    invitation.role?.name,
    invitation.role_name,
    invitation.job_title,
    invitation.specialty,
    getStatus(invitation),
  ]
    .filter(Boolean)
    .some((value) => value!.toLowerCase().includes(query));
}

function matchesStatus(
  invitation: ApiStaffInvitation,
  status: InvitationStatusFilter,
) {
  if (status === "all") return true;

  const invitationStatus = getStatusTranslationKey(getStatus(invitation));
  return invitationStatus === status;
}

function StatusBadge({ status }: { status: string }) {
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

function TableSkeleton() {
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

type InvitationsTableProps = {
  invitations: ApiStaffInvitation[];
  onDelete: (invitation: ApiStaffInvitation) => void;
  onResend: (invitation: ApiStaffInvitation) => void;
  onSelect: (invitation: ApiStaffInvitation) => void;
  resendingId: string | null;
  selectedId: string | null;
};

function InvitationsTable({
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

type InvitationDrawerProps = {
  invitation: ApiStaffInvitation | null;
  isDeleting: boolean;
  isLoading: boolean;
  isOpen: boolean;
  isResending: boolean;
  onDelete: (invitation: ApiStaffInvitation) => void;
  onOpenChange: (open: boolean) => void;
  onResend: (invitation: ApiStaffInvitation) => void;
};

function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-1 whitespace-pre-line text-sm font-medium text-brand-black">
        {value || "-"}
      </p>
    </div>
  );
}

function InvitationDrawer({
  invitation,
  isDeleting,
  isLoading,
  isOpen,
  isResending,
  onDelete,
  onOpenChange,
  onResend,
}: InvitationDrawerProps) {
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
                    value={invitation.job_title}
                  />
                  <DetailRow
                    label={t("fields.phone")}
                    value={invitation.phone}
                  />
                  <DetailRow
                    label={t("fields.specialty")}
                    value={invitation.specialty}
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
                    value={formatDate(invitation.accepted_at)}
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

export function StaffInvitationsPage() {
  const t = useTranslations("staff.invitations");
  const staffT = useTranslations("staff");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<InvitationStatusFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ApiStaffInvitation | null>(
    null,
  );
  const [resendingId, setResendingId] = useState<string | null>(null);

  const {
    data: currentUser,
    isLoading: isCurrentUserLoading,
    isError: isCurrentUserError,
  } = useCurrentUser();
  const primaryProfile = getActiveProfile(currentUser);
  const organizationId = primaryProfile?.organization.id;
  const branchId = primaryProfile?.branch.id;

  const {
    data: invitationsResult,
    isLoading: isInvitationsLoading,
    isError: isInvitationsError,
  } = useStaffInvitations(organizationId, branchId);
  const invitations = useMemo(
    () => invitationsResult?.data ?? [],
    [invitationsResult?.data],
  );
  const selectedFallback =
    invitations.find((invitation) => invitation.id === selectedId) ?? null;
  const detailQuery = useStaffInvitation(organizationId, branchId, selectedId);
  const resendInvitation = useResendStaffInvitation();
  const deleteInvitation = useDeleteStaffInvitation();

  const filteredInvitations = useMemo(
    () =>
      invitations.filter(
        (invitation) =>
          matchesStatus(invitation, status) &&
          matchesSearch(invitation, search),
      ),
    [invitations, search, status],
  );

  const isLoading = isCurrentUserLoading || isInvitationsLoading;
  const isError = isCurrentUserError || isInvitationsError;
  const hasNoBranch =
    !isCurrentUserLoading &&
    !isCurrentUserError &&
    currentUser &&
    (!organizationId || !branchId);
  const selectedInvitation = detailQuery.data ?? selectedFallback;
  const isDrawerOpen = !!selectedId;

  async function handleResend(invitation: ApiStaffInvitation) {
    if (!organizationId || !branchId) {
      toast.error(t("noBranch"));
      return;
    }

    setResendingId(invitation.id);

    try {
      await resendInvitation.mutateAsync({
        branchId,
        invitationId: invitation.id,
        organizationId,
      });
      toast.success(t("resendSuccess"));
    } catch (error) {
      toast.error(unwrapApiError(error, t("resendError")));
    } finally {
      setResendingId(null);
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    if (!organizationId || !branchId) {
      toast.error(t("noBranch"));
      return;
    }

    try {
      await deleteInvitation.mutateAsync({
        branchId,
        invitationId: pendingDelete.id,
        organizationId,
      });
      toast.success(t("deleteSuccess"));
      if (selectedId === pendingDelete.id) {
        setSelectedId(null);
      }
      setPendingDelete(null);
    } catch (error) {
      toast.error(unwrapApiError(error, t("deleteError")));
    }
  }

  return (
    <>
      <div className="flex h-full flex-col gap-4 p-4 lg:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <nav
              aria-label={t("breadcrumbLabel")}
              className="flex items-center gap-2"
            >
              <Link
                href="/dashboard/staff"
                className="text-2xl font-medium text-gray-400 transition-colors hover:text-brand-primary"
              >
                {staffT("title")}
              </Link>
              <ChevronRight
                className="size-5 text-gray-300 rtl:rotate-180"
                aria-hidden="true"
              />
              <h1 className="text-2xl font-medium text-brand-black">
                {t("title")}
              </h1>
            </nav>
            <p className="mt-1 text-sm text-gray-400">{t("subtitle")}</p>
          </div>
          <Button
            type="button"
            className="rounded-full bg-brand-primary px-5 text-white hover:bg-brand-primary/90"
            onClick={() => {
              const firstPending =
                filteredInvitations.find(
                  (invitation) =>
                    getStatusTranslationKey(getStatus(invitation)) ===
                    "pending",
                ) ?? filteredInvitations[0];
              if (firstPending) setSelectedId(firstPending.id);
            }}
            disabled={filteredInvitations.length === 0}
          >
            <Send className="size-4" aria-hidden="true" />
            {t("manageLatest")}
          </Button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white/50">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div
              className="flex rounded-full bg-gray-50 p-1"
              role="tablist"
              aria-label={t("filtersLabel")}
            >
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  role="tab"
                  aria-selected={status === filter}
                  onClick={() => setStatus(filter)}
                  className={cn(
                    "rounded-full px-4 py-1 text-sm transition-colors",
                    status === filter
                      ? "bg-brand-primary text-white shadow-sm"
                      : "text-gray-500 hover:bg-white hover:text-brand-black",
                  )}
                >
                  {t(`filters.${filter}`)}
                </button>
              ))}
            </div>

            <label className="relative block w-full sm:w-72">
              <span className="sr-only">{t("searchPlaceholder")}</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("searchPlaceholder")}
                className="h-9 w-full rounded-full border border-gray-200 bg-white ps-3 pe-9 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
              />
              <Search
                className="pointer-events-none absolute inset-e-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
                aria-hidden="true"
              />
            </label>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {isLoading ? (
              <TableSkeleton />
            ) : isError ? (
              <div className="flex min-h-60 items-center justify-center text-sm text-red-400">
                {t("loadError")}
              </div>
            ) : hasNoBranch ? (
              <div className="flex min-h-60 items-center justify-center text-sm text-gray-400">
                {t("noBranch")}
              </div>
            ) : (
              <InvitationsTable
                invitations={filteredInvitations}
                onDelete={setPendingDelete}
                onResend={handleResend}
                onSelect={(invitation) => setSelectedId(invitation.id)}
                resendingId={resendingId}
                selectedId={selectedId}
              />
            )}
          </div>

          <div className="border-t border-gray-100 px-4 py-3">
            <p className="text-xs text-gray-400">
              {!isLoading &&
                t("showResults", {
                  count: filteredInvitations.length,
                  total: invitations.length,
                })}
            </p>
          </div>
        </div>
      </div>

      <InvitationDrawer
        invitation={selectedInvitation}
        isDeleting={deleteInvitation.isPending}
        isLoading={detailQuery.isPending && !!selectedId}
        isOpen={isDrawerOpen}
        isResending={resendingId === selectedId}
        onDelete={setPendingDelete}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
        onResend={handleResend}
      />

      <AlertDialog.Root
        open={!!pendingDelete}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-60 bg-black/35" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-61 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-5 shadow-2xl outline-none">
            <AlertDialog.Title className="text-lg font-medium text-brand-black">
              {t("deleteTitle")}
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-gray-500">
              {t("deleteDescription", {
                email: pendingDelete?.email ?? t("thisInvitation"),
              })}
            </AlertDialog.Description>
            <div className="mt-5 flex justify-end gap-2">
              <AlertDialog.Cancel asChild>
                <Button type="button" variant="outline">
                  {t("cancel")}
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={(event) => {
                    event.preventDefault();
                    void handleDelete();
                  }}
                  disabled={deleteInvitation.isPending}
                >
                  {deleteInvitation.isPending ? t("deleting") : t("delete")}
                </Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  );
}
