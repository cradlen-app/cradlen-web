"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertDialog } from "radix-ui";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import {
  getActiveProfile,
  getDefaultBranch,
  getProfileOrganization,
  getProfileOrganizationId,
  getProfilePrimaryRole,
} from "@/features/auth/lib/current-user";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { ApiError } from "@/lib/api";
import { useDeactivateStaff } from "../hooks/useManageStaff";
import { useStaff, useStaffMember } from "../hooks/useStaff";
import { useStaffDirectory } from "../hooks/useStaffDirectory";
import { useStaffRoles } from "../hooks/useStaffRoles";
import { getStaffFullName } from "../lib/staff.utils";
import type { StaffFilter, StaffMember } from "../types/staff.types";
import { StaffCreateDrawer } from "./StaffCreateDrawer";
import { StaffHeader } from "./StaffHeader";
import { StaffOverview } from "./StaffOverview";
import { StaffTable } from "./StaffTable";
import { StaffToolbar } from "./StaffToolbar";

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
  if (error instanceof ApiError) {
    return error.messages[0] || fallback;
  }

  return fallback;
}

export function StaffPage() {
  const t = useTranslations("staff");
  const overviewT = useTranslations("staff.overview");
  const [filter, setFilter] = useState<StaffFilter>("all");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [createMethod, setCreateMethod] = useState<"invite" | "direct" | null>(null);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [deactivatingMember, setDeactivatingMember] =
    useState<StaffMember | null>(null);
  const deactivateStaff = useDeactivateStaff();
  const {
    data: currentUser,
    isLoading: isCurrentUserLoading,
    isError: isCurrentUserError,
  } = useCurrentUser();
  const selectedBranchId = useAuthContextStore((state) => state.branchId);
  const primaryProfile = getActiveProfile(currentUser);
  const currentUserStaffId = primaryProfile?.staff_id;
  const currentUserRole = getProfilePrimaryRole(primaryProfile);
  const canManage = currentUserRole === "owner";
  const organization = getProfileOrganization(primaryProfile);
  const activeBranch = getDefaultBranch(primaryProfile, selectedBranchId);
  const organizationId = getProfileOrganizationId(primaryProfile);
  const organizationName = organization?.name;
  const branchId = activeBranch?.id;
  const branchName = activeBranch
    ? [
        activeBranch.address,
        activeBranch.city,
        activeBranch.governorate,
      ]
        .filter(Boolean)
        .join(", ")
    : undefined;
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
    q: deferredSearch,
    roleId: selectedRoleId,
  });
  const isLoading = isCurrentUserLoading || isStaffLoading;
  const isError = isCurrentUserError || isStaffError;
  const hasNoBranch =
    !isCurrentUserLoading &&
    !isCurrentUserError &&
    currentUser &&
    (!organizationId || !branchId);

  const {
    filteredStaff,
    selectedId,
    selectedMember,
    setSelectedId,
    totalStaff,
  } = useStaffDirectory({ filter, search: deferredSearch, staff });
  const { data: editingMemberDetail } = useStaffMember(
    organizationId,
    branchId,
    editingMember?.id ?? null,
  );

  async function handleDeactivateStaff() {
    if (!deactivatingMember) return;

    try {
      if (deactivatingMember.id === currentUserStaffId) {
        toast.error(overviewT("deactivateSelfError"));
        return;
      }

      if (!organizationId || !branchId) {
        toast.error(t("noBranch"));
        return;
      }

      await deactivateStaff.mutateAsync({
        branchId,
        organizationId,
        staffId: deactivatingMember.id,
      });
      toast.success(overviewT("deactivateSuccess"));
      if (selectedId === deactivatingMember.id) {
        setSelectedId(null);
      }
      setDeactivatingMember(null);
    } catch (error) {
      toast.error(unwrapApiError(error, overviewT("deactivateError")));
    }
  }

  return (
    <>
      <div className="flex h-full flex-col gap-4 p-4 lg:flex-row lg:p-6">
        <section className="flex min-w-0 flex-1 flex-col gap-4">
          <StaffHeader
            canManage={canManage}
            onInviteStaff={() => setCreateMethod("invite")}
            onCreateDirectStaff={() => setCreateMethod("direct")}
          />

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white/50">
            <StaffToolbar
              activeFilter={filter}
              search={search}
              onFilterChange={setFilter}
              onSearchChange={setSearch}
            />

            <div className="min-h-0 flex-1 overflow-y-auto">
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
                  members={filteredStaff}
                  selectedId={selectedId}
                  onSelect={(member) => setSelectedId(member.id)}
                />
              )}
            </div>

            <div className="border-t border-gray-100 px-4 py-3">
              <p className="text-xs text-gray-400">
                {!isLoading &&
                  t("showResults", { count: filteredStaff.length, total: totalStaff })}
              </p>
            </div>
          </div>
        </section>

        <StaffOverview
          canManage={canManage}
          currentUserStaffId={currentUserStaffId}
          member={selectedMember}
          onDeactivate={setDeactivatingMember}
          onEdit={setEditingMember}
        />
      </div>

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
        open={!!deactivatingMember}
        onOpenChange={(open) => {
          if (!open) setDeactivatingMember(null);
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
                  disabled={deactivateStaff.isPending}
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
