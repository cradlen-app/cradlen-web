"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { getBranchId, getProfileBranches } from "@/features/auth/lib/current-user";
import { useUserProfileContext } from "@/features/auth/hooks/useUserProfileContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PatientStatCards } from "@/features/patients/components/PatientStatCards";
import { StaffStatCards } from "@/core/staff/pages";
import { DashboardKpiRow } from "./overview/DashboardKpiRow";
import { DashboardVisitsChart } from "./overview/DashboardVisitsChart";
import { DashboardFinancialOverview } from "./overview/DashboardFinancialOverview";
import { DashboardTopPerformers } from "./overview/DashboardTopPerformers";

const ORG_SCOPE = "org";

export function DashboardHome() {
  const t = useTranslations("dashboardHome");
  const tOverview = useTranslations("dashboardHome.overview");
  const {
    currentUser,
    activeProfile,
    organizationId,
    organizationName,
    branchId,
    branchName,
    hasAnyStaffRole,
    isOwner,
    isBranchManager,
    isClinical,
  } = useUserProfileContext();

  const [scope, setScope] = useState<string>(branchId ?? "");

  if (!hasAnyStaffRole) return null;

  const branches = getProfileBranches(activeProfile);
  const canToggleScope = isOwner && branches.length > 1;
  const scopeOrgWide = canToggleScope && scope === ORG_SCOPE;
  const effectiveBranchId = canToggleScope && !scopeOrgWide ? scope : branchId;
  const selectedBranchName =
    branches.find((b) => getBranchId(b) === effectiveBranchId)?.name ?? branchName;

  const showRevenue = isOwner || isBranchManager;
  const showPatients = isOwner || isBranchManager || isClinical;
  const showStaffAndPerformers = isOwner || isBranchManager;

  const greetingFirstName = currentUser?.first_name ?? "";
  const todayLabel = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date());

  const subtitle = [organizationName, !scopeOrgWide ? selectedBranchName : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <main className="space-y-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-brand-black">
            {greetingFirstName
              ? t("titleWithName", { name: greetingFirstName })
              : t("title")}
          </h1>
          <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {canToggleScope && (
            <Select value={scope} onValueChange={setScope}>
              <SelectTrigger size="sm" className="h-8 min-w-44 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ORG_SCOPE}>{tOverview("scope.org")}</SelectItem>
                {branches.map((b) => {
                  const id = getBranchId(b) ?? "";
                  return (
                    <SelectItem key={id} value={id}>
                      {b.name}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}
          <span className="inline-flex items-center rounded-full border border-gray-100 bg-white px-3 py-1 text-[11px] font-medium text-gray-500 shadow-sm">
            {t("todayBadge", { date: todayLabel })}
          </span>
        </div>
      </header>

      <DashboardKpiRow
        branchId={effectiveBranchId}
        orgId={organizationId}
        orgWide={scopeOrgWide}
        showRevenue={showRevenue}
        showPatients={showPatients}
      />

      <DashboardVisitsChart
        branchId={effectiveBranchId}
        orgId={organizationId}
        orgWide={scopeOrgWide}
      />

      {showRevenue && (
        <DashboardFinancialOverview
          branchId={effectiveBranchId}
          orgWide={scopeOrgWide}
        />
      )}

      {showPatients && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-gray-700">
            {tOverview("sections.patientGrowth")}
          </h2>
          <PatientStatCards branchId={effectiveBranchId} orgWide={scopeOrgWide} />
        </section>
      )}

      {showStaffAndPerformers && (
        <>
          <section className="space-y-3">
            <h2 className="text-sm font-medium text-gray-700">
              {tOverview("sections.staff")}
            </h2>
            <StaffStatCards
              organizationId={organizationId}
              branchId={effectiveBranchId}
            />
          </section>
          <DashboardTopPerformers
            branchId={effectiveBranchId}
            orgWide={scopeOrgWide}
          />
        </>
      )}
    </main>
  );
}
