"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/common/utils/utils";
import { formatBranchLocation } from "@/common/utils/branch.utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getBranchId,
  getProfileBranches,
} from "@/features/auth/lib/current-user";
import { useUserProfileContext } from "@/features/auth/hooks/useUserProfileContext";

import { financialCan } from "../permissions";
import type { ReportParams } from "../types/financial.types";
import { FinancialPageShell } from "./FinancialPageShell";
import {
  ArAgingPanel,
  ByBranchPanel,
  ByDoctorPanel,
  ByMethodPanel,
  ByServicePanel,
  CollectionsPanel,
  DailyPanel,
  OutstandingPanel,
  OverviewPanel,
  SummaryPanel,
} from "./report-panels";

type Tab =
  | "overview"
  | "daily"
  | "byService"
  | "byDoctor"
  | "byBranch"
  | "byMethod"
  | "arAging"
  | "collections"
  | "writeOffs"
  | "outstanding";

const TABS: Tab[] = [
  "overview",
  "daily",
  "byService",
  "byDoctor",
  "byMethod",
  "arAging",
  "collections",
  "writeOffs",
  "outstanding",
];

/** Tab list including the cross-branch comparison (owners with >1 branch). */
const TABS_WITH_BRANCH: Tab[] = [
  "overview",
  "daily",
  "byService",
  "byDoctor",
  "byBranch",
  "byMethod",
  "arAging",
  "collections",
  "writeOffs",
  "outstanding",
];

/**
 * Tabs shown to a doctor viewing only their own revenue. Excludes the org-wide
 * surfaces (by-doctor, by-branch, collections-by-staff, write-offs) that don't
 * apply to a single provider.
 */
const OWN_TABS: Tab[] = [
  "overview",
  "daily",
  "byService",
  "byMethod",
  "arAging",
  "outstanding",
];

/** Sentinel select value meaning "no branch_id" → organization-wide (owner only). */
const ORG_WIDE = "__org_wide__";

export function ReportsPage() {
  const t = useTranslations("financial.reports");
  const {
    activeProfile,
    branchId: activeBranchId,
    isOwner,
    currentUserStaffId,
  } = useUserProfileContext();
  const branches = getProfileBranches(activeProfile);

  // Full-report viewers (owner / branch manager / accountant) get the full
  // dashboard; any other permitted viewer (a matched-specialty doctor) sees only
  // their own revenue. The org-wide "All Branches" option below stays owner-only,
  // so managers and accountants get the full layout scoped to a single branch.
  const ownReportsOnly = !financialCan.viewReports(activeProfile);

  const [tab, setTab] = useState<Tab>("overview");
  const [fromInput, setFromInput] = useState("");
  const [toInput, setToInput] = useState("");
  const [params, setParams] = useState<ReportParams>({});

  // Branch scope: an empty selection falls back to the active branch (handled
  // below and in the Select's value). ORG_WIDE means "send no branch_id"
  // (organization-wide, owner only).
  const [branchScope, setBranchScope] = useState<string>("");

  const effectiveBranchId =
    branchScope === ORG_WIDE ? undefined : branchScope || activeBranchId;

  // Cross-branch analytics: only for owners of a multi-branch org. They follow
  // the branch selector like every other panel — a specific branch shows just
  // that branch, "All branches" shows the full comparison (see reportParams).
  const showBranchAnalytics = isOwner && branches.length > 1;
  const visibleTabs = ownReportsOnly
    ? OWN_TABS
    : showBranchAnalytics
      ? TABS_WITH_BRANCH
      : TABS;

  // Compose the branch dimension with the applied date range. Own-revenue
  // doctors additionally scope every report to their own provider id.
  const reportParams = useMemo<ReportParams>(
    () => ({
      ...(effectiveBranchId ? { branch_id: effectiveBranchId } : {}),
      ...(ownReportsOnly && currentUserStaffId
        ? { doctor_id: currentUserStaffId }
        : {}),
      ...params,
    }),
    [effectiveBranchId, ownReportsOnly, currentUserStaffId, params],
  );

  function applyRange() {
    setParams({
      date_from: fromInput || undefined,
      date_to: toInput || undefined,
    });
  }

  return (
    <FinancialPageShell title={t("title")} subtitle={t("subtitle")}>
      <div className="flex flex-col gap-5">
        {/* Filters: branch scope + date range */}
        <div className="flex flex-wrap items-end gap-3">
          {!ownReportsOnly && (isOwner || branches.length > 1) && (
            <label className="flex flex-col gap-1 text-xs text-gray-500">
              {t("filters.branch")}
              <Select
                value={branchScope || activeBranchId || ""}
                onValueChange={setBranchScope}
              >
                <SelectTrigger size="sm" className="min-w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => {
                    const id = getBranchId(b);
                    return id ? (
                      <SelectItem key={id} value={id}>
                        {b.name ?? formatBranchLocation(b) ?? id}
                      </SelectItem>
                    ) : null;
                  })}
                  {isOwner && (
                    <SelectItem value={ORG_WIDE}>
                      {t("filters.allBranches")}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </label>
          )}
          <label className="flex flex-col gap-1 text-xs text-gray-500">
            {t("filters.from")}
            <input
              type="date"
              value={fromInput}
              onChange={(e) => setFromInput(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-brand-primary"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-gray-500">
            {t("filters.to")}
            <input
              type="date"
              value={toInput}
              onChange={(e) => setToInput(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-brand-primary"
            />
          </label>
          <Button type="button" size="sm" variant="outline" onClick={applyRange}>
            {t("filters.apply")}
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 border-b border-gray-100">
          {visibleTabs.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                tab === key
                  ? "border-brand-primary text-brand-primary"
                  : "border-transparent text-gray-400 hover:text-brand-black",
              )}
            >
              {t(`tabs.${key}`)}
            </button>
          ))}
        </div>

        {/* Active panel */}
        <div className="min-h-[320px]">
          {tab === "overview" && (
            <OverviewPanel
              params={reportParams}
              showBranchAnalytics={showBranchAnalytics}
              ownScope={ownReportsOnly}
            />
          )}
          {tab === "daily" && <DailyPanel params={reportParams} />}
          {tab === "byService" && <ByServicePanel params={reportParams} />}
          {tab === "byDoctor" && <ByDoctorPanel params={reportParams} />}
          {tab === "byBranch" && showBranchAnalytics && (
            <ByBranchPanel params={reportParams} />
          )}
          {tab === "byMethod" && <ByMethodPanel params={reportParams} />}
          {tab === "arAging" && <ArAgingPanel params={reportParams} />}
          {tab === "collections" && <CollectionsPanel params={reportParams} />}
          {tab === "writeOffs" && (
            <SummaryPanel name="write-offs" params={reportParams} />
          )}
          {tab === "outstanding" && <OutstandingPanel params={reportParams} />}
        </div>
      </div>
    </FinancialPageShell>
  );
}
