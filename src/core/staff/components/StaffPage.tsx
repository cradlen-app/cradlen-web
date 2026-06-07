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
import { usePermission } from "@/kernel";
import { ApiError } from "@/infrastructure/http/api";
import { useRemoveStaffFromBranch } from "../hooks/useManageStaff";
import { useStaff, useStaffMember } from "../hooks/useStaff";
import { useStaffDirectory } from "../hooks/useStaffDirectory";
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

/** Height of the fixed mobile bottom tab bar; mobile sheets stop above it. */
const BOTTOM_NAV_HEIGHT = 64;

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
  const [removingMember, setRemovingMember] = useState<StaffMember | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const removeStaff = useRemoveStaffFromBranch();

  const {
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

  const {
    data: staff = [],
    isLoading: isStaffLoading,
    isError: isStaffError,
  } = useStaff(organizationId, branchId, {
    search: deferredSearch,
    role: filter === "all" ? undefined : filter,
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
  }, [filter, deferredSearch]);

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

  const { data: editingMemberDetail } = useStaffMember(
    organizationId,
    branchId,
    editingMember?.id ?? null,
  );

  // Removing a member from their only branch deletes their whole profile, so
  // that case escalates to a typed-name confirmation.
  const isLastBranch = !!removingMember && removingMember.branches.length <= 1;

  async function handleRemoveFromBranch() {
    if (!removingMember) return;
    try {
      if (removingMember.id === currentUserStaffId && isLastBranch) {
        toast.error(overviewT("removeSelfError"));
        return;
      }
      if (!organizationId || !branchId) {
        toast.error(t("noBranch"));
        return;
      }
      await removeStaff.mutateAsync({
        organizationId,
        branchId,
        staffId: removingMember.id,
      });
      toast.success(overviewT("removeSuccess"));
      if (selectedId === removingMember.id) setSelectedId(null);
      setRemovingMember(null);
      setDeleteConfirmText("");
    } catch (error) {
      toast.error(unwrapApiError(error, overviewT("removeError")));
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
      <div className="flex h-full flex-col gap-4 p-4 pb-24 lg:flex-row lg:p-6 lg:pb-6">
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
          currentBranchId={branchId}
          currentUserStaffId={currentUserStaffId}
          member={selectedMember}
          onEdit={setEditingMember}
          onRemoveFromBranch={setRemovingMember}
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
            style={{ top: "4rem", bottom: BOTTOM_NAV_HEIGHT }}
            className="fixed inset-x-0 z-50 bg-black/40 lg:hidden"
          />
          <Dialog.Content
            aria-describedby={undefined}
            style={{ top: "4rem", bottom: BOTTOM_NAV_HEIGHT }}
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
                currentBranchId={branchId}
                currentUserStaffId={currentUserStaffId}
                member={selectedMember}
                onEdit={setEditingMember}
                onRemoveFromBranch={setRemovingMember}
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
        open={!!removingMember}
        onOpenChange={(open) => {
          if (!open) {
            setRemovingMember(null);
            setDeleteConfirmText("");
          }
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-60 bg-black/35" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-61 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-5 shadow-2xl outline-none">
            <AlertDialog.Title className="text-lg font-medium text-brand-black">
              {overviewT(isLastBranch ? "removeLastTitle" : "removeTitle")}
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-gray-500">
              {overviewT(
                isLastBranch ? "removeLastDescription" : "removeDescription",
                {
                  name: removingMember
                    ? getStaffFullName(removingMember)
                    : overviewT("thisStaffMember"),
                  branch: branchName ?? "",
                },
              )}
            </AlertDialog.Description>
            {isLastBranch && removingMember && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-gray-500">
                  {overviewT("typedConfirmHint", {
                    name: getStaffFullName(removingMember),
                  })}
                </p>
                <input
                  type="text"
                  autoFocus
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={getStaffFullName(removingMember)}
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
                    void handleRemoveFromBranch();
                  }}
                  disabled={
                    removeStaff.isPending ||
                    !removingMember ||
                    (isLastBranch &&
                      deleteConfirmText.trim() !==
                        getStaffFullName(removingMember).trim())
                  }
                >
                  {removeStaff.isPending
                    ? overviewT("removing")
                    : overviewT("remove")}
                </Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  );
}
