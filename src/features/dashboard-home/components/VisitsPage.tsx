"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import {
  getActiveProfile,
  getDefaultBranch,
} from "@/features/auth/lib/current-user";
import {
  canCreateVisit as canCreateVisitPerm,
  hasAnyStaffRole,
  isClinical,
  showsAssignedVisits,
  showsBranchAggregate,
} from "@/features/auth/lib/permissions";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { CurrentVisitCard } from "@/features/visits/components/CurrentVisitCard";
import { InProgressByDoctorPanel } from "@/features/visits/components/InProgressByDoctorPanel";
import { VisitsOverviewPanel } from "@/features/visits/components/VisitsOverviewPanel";
import { WaitingListSection } from "@/features/visits/components/WaitingListSection";
import { useVisitSocket } from "@/features/visits/hooks/useVisitSocket";
import { getTodayIso } from "@/features/visits/lib/visits.utils";

export function VisitsPage() {
  const t = useTranslations("visits");
  const { data: user } = useCurrentUser();
  const branchId = useAuthContextStore((s) => s.branchId);
  const organizationId = useAuthContextStore((s) => s.organizationId);
  const profile = getActiveProfile(user);
  const branch = getDefaultBranch(profile, branchId ?? undefined);

  const profileId = useAuthContextStore((s) => s.profileId);
  const [selectedDate, setSelectedDate] = useState(() => getTodayIso());

  useVisitSocket(profileId, branchId);

  if (!hasAnyStaffRole(profile)) return null;

  const showAssigned = showsAssignedVisits(profile);
  const showAggregate = showsBranchAggregate(profile);
  const profileIsClinical = isClinical(profile);

  const canCreateVisit = canCreateVisitPerm(profile);
  // Anyone with a staff role and access to this page can manage visit status.
  const canManageStatus = hasAnyStaffRole(profile);

  return (
    <main className="space-y-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-brand-black">
            {t("pageTitle")}
          </h1>
          <p className="mt-0.5 text-xs text-gray-500">{t("breadcrumb")}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <section className="space-y-6 lg:col-span-3">
          {showAssigned && (
            <CurrentVisitCard
              branchId={branchId}
              organizationId={organizationId}
            />
          )}
          {showAggregate && (
            <InProgressByDoctorPanel
              branchId={branchId}
              organizationId={organizationId}
              filterDoctorId={profileIsClinical ? (profile?.staff_id ?? undefined) : undefined}
            />
          )}
          <WaitingListSection
            branchId={branchId}
            organizationId={organizationId}
            branchName={branch?.name ?? branch?.city}
            canCreateVisit={canCreateVisit}
            canManageStatus={canManageStatus}
            assignedToMe={showAssigned}
            isDoctor={showAssigned}
          />
        </section>
        <aside>
          <VisitsOverviewPanel
            branchId={branchId}
            selectedDate={selectedDate}
            onSelect={setSelectedDate}
            assignedToMe={showAssigned}
          />
        </aside>
      </div>
    </main>
  );
}
