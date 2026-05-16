"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Dialog } from "radix-ui";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useTranslations } from "next-intl";
import { AlertDialog } from "radix-ui";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useUserProfileContext } from "@/features/auth/hooks/useUserProfileContext";
import { isOwner as isOwnerPerm } from "@/features/auth/lib/permissions";
import { usePermission } from "@/kernel";
import { ApiError } from "@/infrastructure/http/api";
import {
  useDeactivateStaff,
  useUnassignStaffFromBranch,
} from "../hooks/useManageStaff";
import { useStaff, useStaffMember } from "../hooks/useStaff";
import { useStaffDirectory } from "../hooks/useStaffDirectory";
import { useStaffRoles } from "../hooks/useStaffRoles";
import { getStaffFullName } from "../lib/staff.utils";
import type { StaffFilter, StaffMember } from "../types/staff.types";
import dynamic from "next/dynamic";

const StaffCreateDrawer = dynamic(
  () => import("./StaffCreateDrawer").then((m) => m.StaffCreateDrawer),
  { loading: () => null },
);
const StaffBulkInviteDrawer = dynamic(
  () => import("./StaffBulkInviteDrawer").then((m) => m.StaffBulkInviteDrawer),
  { loading: () => null },
);
import { cn } from "@/common/utils/utils";
import { StaffHeader } from "./StaffHeader";
import { StaffOverview } from "./StaffOverview";
import { StaffTable } from "./StaffTable";
import { StaffToolbar } from "./StaffToolbar";

const PAGE_SIZE = 11;

function StaffTableSkeleton() {
  return (
    <div className="overflow-x-auto bg-white px-4">
      <div className="h-10 border-b border-gray-100" />
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 border-b border-gray-50 py-3 last:border-0">
          <div className="size-8 shrink-0 animate-pulse rounded-full bg-gray-100" />
          <div className="flex flex-1 flex-col gap-1.5">
            <div className="h-3 w-32 animate-pulse rounded bg-gray-100" />
            <div className="h-2.5 w-20 animate-pulse rounded bg-gray-50" />
          </div>
          <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
          <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
          <div className="h-3 w-16 animate-pulse rounded bg-gray-100" />
          <div className="h-4 w-16 animate-pulse rounded-full bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

function unwrapApiError(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.messages[0] || fallback;
  return fallback;
}

export function StaffPage() {
  const t = useTranslations("staff");
  const overviewT = useTranslations("staff.overview");
  const [filter, setFilter] = useState<StaffFilter>("all");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [createMethod, setCreateMethod] = useState<"invite" | "direct" | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [deactivatingMember, setDeactivatingMember] = useState<StaffMember | null>(null);
  const [unassigningMember, setUnassigningMember] = useState<StaffMember | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [scope, setScope] = useState<"org" | "mine">("org");
  const deactivateStaff = useDeactivateStaff();
  const unassignStaff = useUnassignStaffFromBranch();

  const {
    activeProfile,
    currentUser,
    isCurrentUserLoading,
    isCurrentUserError,
    currentUserStaffId,
    organizationId,
    organizationName,
    branchId,
    branchName,
  } = useUserProfileContext();

  const canView = usePermission("staff.read");
  const canManage = usePermission("staff.manage");
  const isOwner = isOwnerPerm(activeProfile);

  const { data: roleFilters = [] } = useStaffRoles(organizationId);
  const selectedRoleId = useMemo(
    () =>
      filter === "all"
        ? undefined
        : roleFilters.find((roleFilter) => roleFilter.role === filter)?.id,
    [filter, roleFilters],
  );

  const {
    data: staff = [],
    isLoading: isStaffLoading,
    isError: isStaffError,
  } = useStaff(organizationId, branchId, {
    search: deferredSearch,
    roleId: selectedRoleId,
    scope: isOwner ? scope : undefined,
  });

  const isLoading = isCurrentUserLoading || isStaffLoading;
  const isError = isCurrentUserError || isStaffError;
  const hasNoBranch =
    !isCurrentUserLoading &&
    !isCurrentUserError &&
    currentUser &&
    (!organizationId || !branchId);

  const { filteredStaff, selectedId, selectedMember, setSelectedId, totalStaff } =
    useStaffDirectory({ filter, search: deferredSearch, staff });

  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(filteredStaff.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [filter, deferredSearch, scope]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const pagedStaff = useMemo(
    () => filteredStaff.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredStaff, page],
  );

  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [mobileOverviewOpen, setMobileOverviewOpen] = useState(false);
  const isMobileOverviewOpen = !isDesktop && mobileOverviewOpen && !!selectedMember;

  const [footerHeight, setFooterHeight] = useState(0);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const footer = document.querySelector("footer");
    if (!footer) return;
    const update = () =>
      setFooterHeight(footer.getBoundingClientRect().height);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(footer);
    return () => ro.disconnect();
  }, []);

  const { data: editingMemberDetail } = useStaffMember(
    organizationId,
    branchId,
    editingMember?.id ?? null,
  );

  async function handleUnassignFromBranch() {
    if (!unassigningMember) return;
    try {
      if (unassigningMember.id === currentUserStaffId) {
        toast.error(overviewT("deactivateSelfError"));
        return;
      }
      if (!organizationId || !branchId) {
        toast.error(t("noBranch"));
        return;
      }
      await unassignStaff.mutateAsync({
        organizationId,
        staffId: unassigningMember.id,
        branchId,
      });
      toast.success(overviewT("unassignSuccess"));
      if (selectedId === unassigningMember.id) setSelectedId(null);
      setUnassigningMember(null);
    } catch (error) {
      toast.error(unwrapApiError(error, overviewT("unassignError")));
    }
  }

  async function handleDeactivateStaff() {
    if (!deactivatingMember) return;

    try {
      if (deactivatingMember.id === currentUserStaffId) {
        toast.error(overviewT("deactivateSelfError"));
        return;
      }

      if (!organizationId) {
        toast.error(t("noBranch"));
        return;
      }

      await deactivateStaff.mutateAsync({
        organizationId,
        staffId: deactivatingMember.id,
      });
      toast.success(overviewT("deactivateSuccess"));
      if (selectedId === deactivatingMember.id) {
        setSelectedId(null);
      }
      setDeactivatingMember(null);
      setDeleteConfirmText("");
    } catch (error) {
      toast.error(unwrapApiError(error, overviewT("deactivateError")));
    }
  }

  if (!isCurrentUserLoading && !canView) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-sm text-gray-400">
        {t("forbidden")}
      </div>
    );
  }

  return (
    <>
      <div className="flex h-full flex-col gap-4 p-4 lg:flex-row lg:p-6">
        <section className="flex min-w-0 flex-1 flex-col gap-4">
          <StaffHeader
            canManage={canManage}
            onInviteStaff={() => setCreateMethod("invite")}
            onCreateDirectStaff={() => setCreateMethod("direct")}
            onBulkInvite={() => setBulkOpen(true)}
          />

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white/50">
            <StaffToolbar
              activeFilter={filter}
              search={search}
              onFilterChange={setFilter}
              onSearchChange={setSearch}
              scope={isOwner ? scope : undefined}
              onScopeChange={isOwner ? setScope : undefined}
            />

            <div className="min-h-0 flex-1 overflow-auto">
              {isLoading ? (
                <StaffTableSkeleton />
              ) : isError ? (
                <div className="flex min-h-60 items-center justify-center text-sm text-red-400">
                  {t("loadError")}
                </div>
              ) : hasNoBranch ? (
                <div className="flex min-h-60 items-center justify-center text-sm text-gray-400">
                  {t("noBranch")}
                </div>
              ) : (
                <StaffTable
                  members={pagedStaff}
                  selectedId={selectedId}
                  onSelect={(member) => {
                    setSelectedId(member.id);
                    if (!isDesktop) setMobileOverviewOpen(true);
                  }}
                />
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3">
              <p className="text-xs text-gray-400">
                {!isLoading &&
                  t("showResults", { count: pagedStaff.length, total: totalStaff })}
              </p>
              {!isLoading && pageCount > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    aria-label={t("pagination.prev")}
                    className={cn(
                      "inline-flex size-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors",
                      "hover:border-brand-primary/40 hover:text-brand-primary",
                      "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-500",
                    )}
                  >
                    <ChevronLeft className="size-3.5 rtl:rotate-180" aria-hidden="true" />
                  </button>
                  <span className="px-1.5 text-xs tabular-nums text-gray-500">
                    {t("pagination.pageOf", { page, total: pageCount })}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                    disabled={page >= pageCount}
                    aria-label={t("pagination.next")}
                    className={cn(
                      "inline-flex size-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors",
                      "hover:border-brand-primary/40 hover:text-brand-primary",
                      "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-500",
                    )}
                  >
                    <ChevronRight className="size-3.5 rtl:rotate-180" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        <StaffOverview
          canManage={canManage}
          canDelete={isOwner}
          currentBranchId={branchId}
          currentUserStaffId={currentUserStaffId}
          member={selectedMember}
          onDeactivate={setDeactivatingMember}
          onEdit={setEditingMember}
          onUnassignFromBranch={setUnassigningMember}
          className="hidden lg:flex lg:flex-col"
          emptyClassName="hidden lg:flex"
        />

      </div>

      <Dialog.Root
        open={isMobileOverviewOpen}
        onOpenChange={(open) => {
          if (!open) setMobileOverviewOpen(false);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay
            style={{ top: "4rem", bottom: footerHeight }}
            className="fixed inset-x-0 z-50 bg-black/40 lg:hidden"
          />
          <Dialog.Content
            aria-describedby={undefined}
            style={{ top: "4rem", bottom: footerHeight }}
            className="fixed inset-x-0 z-50 flex flex-col bg-white outline-none lg:hidden"
          >
            <Dialog.Title className="sr-only">{overviewT("title")}</Dialog.Title>
            <Dialog.Close
              aria-label={overviewT("cancel")}
              className="absolute end-3 top-3 z-10 inline-flex size-8 items-center justify-center rounded-full bg-white/90 text-gray-500 shadow-sm transition-colors hover:bg-gray-100 hover:text-brand-black"
            >
              <X className="size-4" aria-hidden="true" />
            </Dialog.Close>
            <div className="flex-1 overflow-y-auto">
              <StaffOverview
                canManage={canManage}
                canDelete={isOwner}
                currentBranchId={branchId}
                currentUserStaffId={currentUserStaffId}
                member={selectedMember}
                onDeactivate={setDeactivatingMember}
                onEdit={setEditingMember}
                onUnassignFromBranch={setUnassigningMember}
                className="rounded-none border-0 shadow-none"
              />
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <StaffCreateDrawer
        branchId={branchId}
        branchName={branchName}
        method={createMethod ?? "invite"}
        onOpenChange={(open) => {
          if (!open) setCreateMethod(null);
        }}
        open={!!createMethod}
        organizationId={organizationId}
        organizationName={organizationName}
      />

      <StaffBulkInviteDrawer
        branchId={branchId}
        branchName={branchName}
        organizationId={organizationId}
        organizationName={organizationName}
        open={bulkOpen}
        onOpenChange={setBulkOpen}
      />

      <StaffCreateDrawer
        branchId={branchId}
        branchName={branchName}
        member={editingMemberDetail ?? editingMember}
        mode="edit"
        onOpenChange={(open) => {
          if (!open) setEditingMember(null);
        }}
        open={!!editingMember}
        organizationId={organizationId}
        organizationName={organizationName}
      />

      <AlertDialog.Root
        open={!!unassigningMember}
        onOpenChange={(open) => {
          if (!open) setUnassigningMember(null);
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-60 bg-black/35" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-61 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-5 shadow-2xl outline-none">
            <AlertDialog.Title className="text-lg font-medium text-brand-black">
              {overviewT("unassignTitle")}
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-gray-500">
              {overviewT("unassignDescription", {
                name: unassigningMember
                  ? getStaffFullName(unassigningMember)
                  : overviewT("thisStaffMember"),
                branch: branchName ?? "",
              })}
            </AlertDialog.Description>
            <div className="mt-5 flex justify-end gap-2">
              <AlertDialog.Cancel asChild>
                <Button type="button" variant="outline">
                  {overviewT("cancel")}
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={(event) => {
                    event.preventDefault();
                    void handleUnassignFromBranch();
                  }}
                  disabled={unassignStaff.isPending}
                >
                  {unassignStaff.isPending
                    ? overviewT("unassigning")
                    : overviewT("unassign")}
                </Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>

      <AlertDialog.Root
        open={!!deactivatingMember}
        onOpenChange={(open) => {
          if (!open) {
            setDeactivatingMember(null);
            setDeleteConfirmText("");
          }
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-60 bg-black/35" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-61 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-5 shadow-2xl outline-none">
            <AlertDialog.Title className="text-lg font-medium text-brand-black">
              {overviewT("deactivateTitle")}
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-gray-500">
              {overviewT("deactivateDescription", {
                name: deactivatingMember
                  ? getStaffFullName(deactivatingMember)
                  : overviewT("thisStaffMember"),
              })}
            </AlertDialog.Description>
            {deactivatingMember && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-gray-500">
                  {overviewT("typedConfirmHint", {
                    name: getStaffFullName(deactivatingMember),
                  })}
                </p>
                <input
                  type="text"
                  autoFocus
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={getStaffFullName(deactivatingMember)}
                  className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-red-400 focus:ring-1 focus:ring-red-200"
                />
              </div>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <AlertDialog.Cancel asChild>
                <Button type="button" variant="outline">
                  {overviewT("cancel")}
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={(event) => {
                    event.preventDefault();
                    void handleDeactivateStaff();
                  }}
                  disabled={
                    deactivateStaff.isPending ||
                    !deactivatingMember ||
                    deleteConfirmText.trim() !==
                      getStaffFullName(deactivatingMember).trim()
                  }
                >
                  {deactivateStaff.isPending
                    ? overviewT("deactivating")
                    : overviewT("deactivate")}
                </Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  );
}
