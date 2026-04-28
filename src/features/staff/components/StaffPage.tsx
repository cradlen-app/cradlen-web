"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { getActiveProfile } from "@/features/auth/lib/current-user";
import { useStaff } from "../hooks/useStaff";
import { useStaffDirectory } from "../hooks/useStaffDirectory";
import type { StaffFilter } from "../types/staff.types";
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

export function StaffPage() {
  const t = useTranslations("staff");
  const [filter, setFilter] = useState<StaffFilter>("all");
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const {
    data: currentUser,
    isLoading: isCurrentUserLoading,
    isError: isCurrentUserError,
  } = useCurrentUser();
  const primaryProfile = getActiveProfile(currentUser);
  const organizationId = primaryProfile?.organization.id;
  const organizationName = primaryProfile?.organization.name;
  const branchId = primaryProfile?.branch.id;
  const branchName = primaryProfile?.branch
    ? [
        primaryProfile.branch.address,
        primaryProfile.branch.city,
        primaryProfile.branch.governorate,
      ]
        .filter(Boolean)
        .join(", ")
    : undefined;
  const { data: staff = [], isLoading: isStaffLoading, isError: isStaffError } = useStaff(organizationId);
  const isLoading = isCurrentUserLoading || isStaffLoading;
  const isError = isCurrentUserError || isStaffError;
  const hasNoOrganization = !isCurrentUserLoading && !isCurrentUserError && currentUser && !organizationId;

  const {
    filteredStaff,
    search,
    selectedId,
    selectedMember,
    setSearch,
    setSelectedId,
    totalStaff,
  } = useStaffDirectory({ filter, staff });

  return (
    <>
      <div className="flex h-full flex-col gap-4 p-4 lg:flex-row lg:p-6">
        <section className="flex min-w-0 flex-1 flex-col gap-4">
          <StaffHeader onCreateStaff={() => setIsCreateDrawerOpen(true)} />

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
              ) : hasNoOrganization ? (
                <div className="flex min-h-60 items-center justify-center text-sm text-gray-400">
                  {t("noOrganization")}
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

        <StaffOverview member={selectedMember} />
      </div>

      <StaffCreateDrawer
        branchId={branchId}
        branchName={branchName}
        onOpenChange={setIsCreateDrawerOpen}
        open={isCreateDrawerOpen}
        organizationId={organizationId}
        organizationName={organizationName}
      />
    </>
  );
}
