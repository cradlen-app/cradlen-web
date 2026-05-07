"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, Search, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import {
  getActiveProfile,
  getDefaultBranch,
} from "@/features/auth/lib/current-user";
import { Link, useRouter } from "@/i18n/navigation";
import { ApiError } from "@/lib/api";
import { useDashboardPath } from "@/hooks/useDashboardPath";
import { cn } from "@/lib/utils";
import {
  useDeleteStaffInvitation,
  useResendStaffInvitation,
  useStaffInvitation,
  useStaffInvitations,
} from "../hooks/useStaffInvitations";
import type { ApiStaffInvitation } from "../types/staff.api.types";
import DeleteInvitationModal from "./DeleteInvitationModal";
import InvitationDetailsPanel from "./InvitationDetailsPanel";
import InvitationsTable, {
  getStatus,
  getStatusTranslationKey,
  TableSkeleton,
} from "./InvitationsTable";

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

function unwrapApiError(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return error.messages[0] || fallback;
  }

  return fallback;
}

function matchesSearch(invitation: ApiStaffInvitation, search: string) {
  const query = search.trim().toLowerCase();
  if (!query) return true;

  return [
    [invitation.first_name, invitation.last_name].filter(Boolean).join(" "),
    invitation.email,
    invitation.phone,
    invitation.phone_number,
    invitation.role?.name,
    invitation.roles?.[0]?.name,
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

export function StaffInvitationsPage({
  initialSelectedId,
}: {
  initialSelectedId?: string;
}) {
  const t = useTranslations("staff.invitations");
  const staffT = useTranslations("staff");
  const dashboardPath = useDashboardPath();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<InvitationStatusFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(
    initialSelectedId ?? null,
  );
  const isFirstSync = useRef(true);

  useEffect(() => {
    if (isFirstSync.current) {
      isFirstSync.current = false;
      return;
    }
    const href = selectedId
      ? dashboardPath(`/staff/invitations/${selectedId}`)
      : dashboardPath("/staff/invitations");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.replace(href as any);
  // router and dashboardPath are stable references
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

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
  const branchId = getDefaultBranch(primaryProfile)?.id;

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
  const detailQuery = useStaffInvitation(organizationId, selectedId);
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
    if (!organizationId) {
      toast.error(t("noBranch"));
      return;
    }

    setResendingId(invitation.id);

    try {
      await resendInvitation.mutateAsync({
        organizationId: organizationId,
        invitationId: invitation.id,
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
    if (!organizationId) {
      toast.error(t("noBranch"));
      return;
    }

    try {
      await deleteInvitation.mutateAsync({
        organizationId: organizationId,
        invitationId: pendingDelete.id,
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
                href={dashboardPath("/staff") as Parameters<typeof Link>[0]["href"]}
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

      <InvitationDetailsPanel
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

      <DeleteInvitationModal
        invitation={pendingDelete}
        isDeleting={deleteInvitation.isPending}
        onConfirm={() => void handleDelete()}
        onOpenChange={() => setPendingDelete(null)}
      />
    </>
  );
}
