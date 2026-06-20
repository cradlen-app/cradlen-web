"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertCircle,
  FileText,
  Percent,
  Wallet,
  type LucideIcon,
} from "lucide-react";

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

import { useFinancialReport } from "../hooks/useReports";
import { financialCan } from "../permissions";
import { formatDate, formatMoney, formatPercent } from "../lib/format";
import type {
  ArAgingReport,
  CollectionsReport,
  DailyRevenueReport,
  OutstandingInvoicesReport,
  PaymentsByMethodReport,
  ReportParams,
  ReportSummary,
  RevenueByBranchReport,
  RevenueByDoctorReport,
  RevenueByServiceReport,
  RevenueSummaryReport,
} from "../types/financial.types";
import { FinancialPageShell } from "./FinancialPageShell";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";

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

const CHART_COLORS = [
  "#11604C",
  "#AAB37D",
  "#3b82f6",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
];

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

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

function Loading() {
  const t = useTranslations("financial.reports");
  return <p className="py-12 text-center text-sm text-gray-400">{t("loading")}</p>;
}

function Empty() {
  const t = useTranslations("financial.reports");
  return <p className="py-12 text-center text-sm text-gray-400">{t("noData")}</p>;
}

function ChartCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-100 p-4">
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {children as React.ReactElement}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-100 p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-base font-semibold tabular-nums text-gray-900">
        {value}
      </p>
    </div>
  );
}

/** Compact table with optional end-aligned (numeric) columns. */
function SimpleTable({
  headers,
  rows,
  alignEnd = [],
}: {
  headers: string[];
  rows: React.ReactNode[][];
  alignEnd?: number[];
}) {
  if (rows.length === 0) return null;
  const end = new Set(alignEnd);
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
            {headers.map((h, i) => (
              <th
                key={i}
                className={cn(
                  "px-3 py-2 font-medium",
                  end.has(i) ? "text-end" : "text-start",
                )}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, r) => (
            <tr key={r} className="border-b border-gray-50 last:border-0">
              {cells.map((cell, c) => (
                <td
                  key={c}
                  className={cn(
                    "px-3 py-2 text-gray-600",
                    end.has(c) && "text-end tabular-nums",
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Polished KPI card: icon chip + label + value (mirrors the visits StatCards). */
function KpiCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
        <span
          className={cn(
            "inline-flex size-6 items-center justify-center rounded-full",
            accent
              ? "bg-brand-primary/10 text-brand-primary"
              : "bg-gray-50 text-gray-400",
          )}
        >
          <Icon className="size-3.5" aria-hidden="true" />
        </span>
        <span className="truncate">{label}</span>
      </div>
      <div className="text-2xl font-semibold tabular-nums text-brand-black">
        {value}
      </div>
    </div>
  );
}

/** Titled bordered card wrapper for an overview widget. */
function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-100 p-4">
      <h3 className="mb-3 text-sm font-medium text-gray-700">{title}</h3>
      {children}
    </div>
  );
}

/** Ranked rows with a proportional bar (longest = highest amount). */
function RankedBars({ rows }: { rows: { label: string; amount: number }[] }) {
  if (rows.length === 0) return <Empty />;
  const max = Math.max(...rows.map((r) => r.amount), 1);
  return (
    <ul className="space-y-3">
      {rows.map((r, i) => (
        <li key={i} className="space-y-1">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate text-gray-700">{r.label}</span>
            <span className="shrink-0 font-semibold tabular-nums text-gray-900">
              {formatMoney(r.amount)}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-brand-primary"
              style={{ width: `${(r.amount / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex flex-col gap-2 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <div className="size-6 animate-pulse rounded-full bg-gray-100" />
            <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
          </div>
          <div className="h-7 w-24 animate-pulse rounded bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

/** Compose the financial reports into an at-a-glance overview dashboard. */
function OverviewPanel({
  params,
  showBranchAnalytics,
  ownScope = false,
}: {
  params: ReportParams;
  showBranchAnalytics: boolean;
  /** Own-revenue doctor view: hide the cross-provider "top doctors" breakdown. */
  ownScope?: boolean;
}) {
  const t = useTranslations("financial.reports.labels");
  const tSection = useTranslations("financial.reports.sections");
  const tBucket = useTranslations("financial.reports.buckets");

  const revenue = useFinancialReport<RevenueSummaryReport>("revenue", params);
  const daily = useFinancialReport<DailyRevenueReport>("daily-revenue", params);
  const byDoctor = useFinancialReport<RevenueByDoctorReport>(
    "revenue-by-doctor",
    params,
    { enabled: !ownScope },
  );
  const byService = useFinancialReport<RevenueByServiceReport>(
    "revenue-by-service",
    params,
  );
  const arAging = useFinancialReport<ArAgingReport>("ar-aging", params);
  // Branch comparison; follows the selected branch, only for multi-branch owners.
  const byBranch = useFinancialReport<RevenueByBranchReport>(
    "revenue-by-branch",
    params,
    { enabled: showBranchAnalytics },
  );

  const invoiced = num(revenue.data?.total_invoiced);
  const collected = num(revenue.data?.total_collected);
  const rate = invoiced > 0 ? (collected / invoiced) * 100 : 0;

  const trend = (daily.data?.rows ?? []).map((r) => ({
    date: r.date,
    invoiced: num(r.invoiced),
    collected: num(r.collected),
  }));

  const topDoctors = [...(byDoctor.data?.by_doctor ?? [])]
    .map((r) => ({ label: r.doctor_name, amount: num(r.total) }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const topServices = [...(byService.data?.by_service ?? [])]
    .map((r) => ({ label: r.service_name, amount: num(r.total) }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const topBranches = [...(byBranch.data?.by_branch ?? [])]
    .map((r) => ({ label: r.branch_name, amount: num(r.billed) }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const buckets = arAging.data
    ? ([
        ["current", arAging.data.buckets.current],
        ["d1_30", arAging.data.buckets.d1_30],
        ["d31_60", arAging.data.buckets.d31_60],
        ["d61_90", arAging.data.buckets.d61_90],
        ["d90_plus", arAging.data.buckets.d90_plus],
      ] as const)
    : [];

  return (
    <div className="flex flex-col gap-5">
      {/* KPI row */}
      {revenue.isLoading ? (
        <KpiSkeleton />
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiCard
            icon={FileText}
            label={t("totalInvoiced")}
            value={formatMoney(invoiced)}
            accent
          />
          <KpiCard
            icon={Wallet}
            label={t("totalCollected")}
            value={formatMoney(collected)}
          />
          <KpiCard
            icon={AlertCircle}
            label={t("outstanding")}
            value={formatMoney(num(revenue.data?.outstanding))}
          />
          <KpiCard
            icon={Percent}
            label={t("collectionRate")}
            value={formatPercent(rate)}
          />
        </div>
      )}

      {/* Revenue vs collections trend */}
      <SectionCard title={tSection("revenueTrend")}>
        {daily.isLoading ? (
          <Loading />
        ) : trend.length === 0 ? (
          <Empty />
        ) : (
          <ChartCard>
            <LineChart
              data={trend}
              margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={56} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="invoiced"
                name={t("invoiced")}
                stroke={CHART_COLORS[0]}
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="collected"
                name={t("collected")}
                stroke={CHART_COLORS[1]}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartCard>
        )}
      </SectionCard>

      {/* Top doctors / Top services — the by-doctor breakdown is org-wide only. */}
      <div className={cn("grid gap-5", !ownScope && "lg:grid-cols-2")}>
        {!ownScope && (
          <SectionCard title={tSection("topDoctors")}>
            {byDoctor.isLoading ? <Loading /> : <RankedBars rows={topDoctors} />}
          </SectionCard>
        )}
        <SectionCard title={tSection("topServices")}>
          {byService.isLoading ? <Loading /> : <RankedBars rows={topServices} />}
        </SectionCard>
      </div>

      {/* Branch breakdown (owners, multi-branch) */}
      {showBranchAnalytics && (
        <SectionCard title={tSection("branchBreakdown")}>
          {byBranch.isLoading ? <Loading /> : <RankedBars rows={topBranches} />}
        </SectionCard>
      )}

      {/* AR aging snapshot */}
      <SectionCard title={tSection("arSnapshot")}>
        {arAging.isLoading ? (
          <Loading />
        ) : !arAging.data ? (
          <Empty />
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {buckets.map(([key, amount]) => (
                <StatCard
                  key={key}
                  label={tBucket(key)}
                  value={formatMoney(num(amount))}
                />
              ))}
            </div>
            <p className="text-sm text-gray-500">
              {t("grandTotal")}:{" "}
              <span className="font-semibold text-gray-900">
                {formatMoney(num(arAging.data.total_outstanding))}
              </span>
            </p>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

/** AR aging buckets with their outstanding amounts. */
function ArAgingPanel({ params }: { params: ReportParams }) {
  const t = useTranslations("financial.reports.labels");
  const tBucket = useTranslations("financial.reports.buckets");
  const { data, isLoading } = useFinancialReport<ArAgingReport>(
    "ar-aging",
    params,
  );
  if (isLoading) return <Loading />;
  if (!data) return <Empty />;

  const buckets = [
    ["current", data.buckets.current],
    ["d1_30", data.buckets.d1_30],
    ["d31_60", data.buckets.d31_60],
    ["d61_90", data.buckets.d61_90],
    ["d90_plus", data.buckets.d90_plus],
  ] as const;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {buckets.map(([key, amount]) => (
          <StatCard
            key={key}
            label={tBucket(key)}
            value={formatMoney(num(amount))}
          />
        ))}
      </div>
      <p className="text-sm text-gray-500">
        {t("grandTotal")}:{" "}
        <span className="font-semibold text-gray-900">
          {formatMoney(num(data.total_outstanding))}
        </span>
      </p>
    </div>
  );
}

/** Collected payments grouped by method and by recording staff. */
function CollectionsPanel({ params }: { params: ReportParams }) {
  const t = useTranslations("financial.reports.labels");
  const tMethod = useTranslations("financial.payments.method");
  const { data, isLoading } = useFinancialReport<CollectionsReport>(
    "collections",
    params,
  );
  if (isLoading) return <Loading />;
  if (!data || (data.by_method.length === 0 && data.by_staff.length === 0))
    return <Empty />;

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500">
        {t("grandTotal")}:{" "}
        <span className="font-semibold text-gray-900">
          {formatMoney(num(data.total))}
        </span>
      </p>
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700">{t("method")}</h3>
        <SimpleTable
          headers={[t("method"), t("total"), t("count")]}
          rows={data.by_method.map((r) => [
            tMethod(r.payment_method),
            formatMoney(num(r.total)),
            String(r.count),
          ])}
          alignEnd={[1, 2]}
        />
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700">{t("staff")}</h3>
        <SimpleTable
          headers={[t("staff"), t("total"), t("count")]}
          rows={data.by_staff.map((r) => [
            r.staff_name,
            formatMoney(num(r.total)),
            String(r.count),
          ])}
          alignEnd={[1, 2]}
        />
      </div>
    </div>
  );
}

/** Generic key/value renderer for the untyped summary reports. */
function SummaryPanel({ name, params }: { name: string; params: ReportParams }) {
  const { data, isLoading } = useFinancialReport<ReportSummary>(name, params);
  if (isLoading) return <Loading />;
  if (!data || Object.keys(data).length === 0) return <Empty />;

  const entries = Object.entries(data).filter(
    ([, v]) => typeof v === "string" || typeof v === "number",
  );
  const arrays = Object.entries(data).filter(([, v]) => Array.isArray(v)) as [
    string,
    Record<string, unknown>[],
  ][];

  return (
    <div className="space-y-5">
      {entries.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {entries.map(([key, value]) => (
            <div key={key} className="rounded-xl border border-gray-100 p-4">
              <p className="text-xs capitalize text-gray-500">
                {key.replace(/_/g, " ")}
              </p>
              <p className="mt-1 text-base font-semibold tabular-nums text-gray-900">
                {typeof value === "number" || /^-?\d/.test(String(value))
                  ? formatMoney(num(value))
                  : String(value)}
              </p>
            </div>
          ))}
        </div>
      )}
      {arrays.map(([key, rows]) => (
        <GenericTable key={key} title={key.replace(/_/g, " ")} rows={rows} />
      ))}
    </div>
  );
}

function GenericTable({
  title,
  rows,
}: {
  title: string;
  rows: Record<string, unknown>[];
}) {
  if (rows.length === 0) return null;
  const cols = Object.keys(rows[0]);
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium capitalize text-gray-700">{title}</h3>
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
              {cols.map((c) => (
                <th key={c} className="px-3 py-2 text-start font-medium capitalize">
                  {c.replace(/_/g, " ")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-gray-50 last:border-0">
                {cols.map((c) => (
                  <td key={c} className="px-3 py-2 text-gray-600">
                    {String(row[c] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DailyPanel({ params }: { params: ReportParams }) {
  const t = useTranslations("financial.reports.labels");
  const { data, isLoading } = useFinancialReport<DailyRevenueReport>(
    "daily-revenue",
    params,
  );
  if (isLoading) return <Loading />;
  if (!data || data.rows.length === 0) return <Empty />;

  const chartData = data.rows.map((r) => ({
    date: r.date,
    invoiced: num(r.invoiced),
    collected: num(r.collected),
  }));

  return (
    <ChartCard>
      <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} width={56} />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="invoiced"
          name={t("invoiced")}
          stroke={CHART_COLORS[0]}
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="collected"
          name={t("collected")}
          stroke={CHART_COLORS[1]}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartCard>
  );
}

function ByServicePanel({ params }: { params: ReportParams }) {
  const t = useTranslations("financial.reports.labels");
  const { data, isLoading } = useFinancialReport<RevenueByServiceReport>(
    "revenue-by-service",
    params,
  );
  if (isLoading) return <Loading />;
  if (!data || data.by_service.length === 0) return <Empty />;

  const chartData = data.by_service.map((r) => ({
    name: r.service_name,
    total: num(r.total),
  }));

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">
        {t("grandTotal")}:{" "}
        <span className="font-semibold text-gray-900">
          {formatMoney(num(data.total))}
        </span>
      </p>
      <ChartCard>
        <BarChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={56} />
          <Tooltip />
          <Bar dataKey="total" name={t("total")} fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartCard>
      <SimpleTable
        headers={[t("service"), t("total"), t("lineCount")]}
        rows={data.by_service.map((r) => [
          r.service_name,
          formatMoney(num(r.total)),
          String(r.line_count),
        ])}
        alignEnd={[1, 2]}
      />
    </div>
  );
}

function ByDoctorPanel({ params }: { params: ReportParams }) {
  const t = useTranslations("financial.reports.labels");
  const { data, isLoading } = useFinancialReport<RevenueByDoctorReport>(
    "revenue-by-doctor",
    params,
  );
  if (isLoading) return <Loading />;
  if (!data || data.by_doctor.length === 0) return <Empty />;

  const chartData = data.by_doctor.map((r) => ({
    name: r.doctor_name,
    total: num(r.total),
  }));

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">
        {t("grandTotal")}:{" "}
        <span className="font-semibold text-gray-900">
          {formatMoney(num(data.total))}
        </span>
      </p>
      <ChartCard>
        <BarChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={56} />
          <Tooltip />
          <Bar dataKey="total" name={t("total")} fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartCard>
      <SimpleTable
        headers={[t("doctor"), t("total"), t("invoiceCount")]}
        rows={data.by_doctor.map((r) => [
          r.doctor_name,
          formatMoney(num(r.total)),
          String(r.invoice_count),
        ])}
        alignEnd={[1, 2]}
      />
    </div>
  );
}

/** Cross-branch comparison: billed revenue + invoice counts per branch. */
function ByBranchPanel({ params }: { params: ReportParams }) {
  const t = useTranslations("financial.reports.labels");
  const { data, isLoading } = useFinancialReport<RevenueByBranchReport>(
    "revenue-by-branch",
    params,
  );
  if (isLoading) return <Loading />;
  if (!data || data.by_branch.length === 0) return <Empty />;

  const rows = [...data.by_branch].sort(
    (a, b) => b.invoice_count - a.invoice_count,
  );
  const chartData = rows.map((r) => ({
    name: r.branch_name,
    total: num(r.billed),
  }));

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">
        {t("grandTotal")}:{" "}
        <span className="font-semibold text-gray-900">
          {formatMoney(num(data.total))}
        </span>
      </p>
      <ChartCard>
        <BarChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={56} />
          <Tooltip />
          <Bar dataKey="total" name={t("invoiced")} fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartCard>
      <SimpleTable
        headers={[
          t("branch"),
          t("invoiceCount"),
          t("invoiced"),
          t("collected"),
          t("outstanding"),
        ]}
        rows={rows.map((r) => [
          r.branch_name,
          String(r.invoice_count),
          formatMoney(num(r.billed)),
          formatMoney(num(r.collected)),
          formatMoney(num(r.outstanding)),
        ])}
        alignEnd={[1, 2, 3, 4]}
      />
    </div>
  );
}

function ByMethodPanel({ params }: { params: ReportParams }) {
  const t = useTranslations("financial.reports.labels");
  const tMethod = useTranslations("financial.payments.method");
  const { data, isLoading } = useFinancialReport<PaymentsByMethodReport>(
    "payments-by-method",
    params,
  );
  if (isLoading) return <Loading />;
  if (!data || data.by_method.length === 0) return <Empty />;

  const grandTotal = num(data.total);
  const chartData = data.by_method.map((r) => ({
    name: tMethod(r.payment_method),
    value: num(r.total),
  }));

  return (
    <div className="space-y-3">
      <ChartCard>
        <PieChart>
          <Tooltip />
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={110}
            label
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ChartCard>
      <SimpleTable
        headers={[t("method"), t("total"), t("count"), t("share")]}
        rows={data.by_method.map((r) => [
          tMethod(r.payment_method),
          formatMoney(num(r.total)),
          String(r.count),
          formatPercent(grandTotal > 0 ? (num(r.total) / grandTotal) * 100 : 0),
        ])}
        alignEnd={[1, 2, 3]}
      />
    </div>
  );
}

function OutstandingPanel({ params }: { params: ReportParams }) {
  const t = useTranslations("financial.reports.labels");
  const { data, isLoading } = useFinancialReport<OutstandingInvoicesReport>(
    "outstanding-invoices",
    params,
  );
  if (isLoading) return <Loading />;
  if (!data || data.invoices.length === 0) return <Empty />;

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">
        {t("grandTotal")}:{" "}
        <span className="font-semibold text-gray-900">
          {formatMoney(num(data.total_outstanding))}
        </span>
      </p>
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
              <th className="px-3 py-2 text-start font-medium">{t("invoice")}</th>
              <th className="px-3 py-2 text-start font-medium">{t("patient")}</th>
              <th className="px-3 py-2 text-start font-medium">{t("doctor")}</th>
              <th className="px-3 py-2 text-start font-medium">{t("status")}</th>
              <th className="px-3 py-2 text-end font-medium">{t("balance")}</th>
              <th className="px-3 py-2 text-end font-medium">{t("lastPayment")}</th>
              <th className="px-3 py-2 text-end font-medium">{t("age")}</th>
            </tr>
          </thead>
          <tbody>
            {data.invoices.map((inv) => (
              <tr key={inv.id} className="border-b border-gray-50 last:border-0">
                <td className="px-3 py-2 font-mono text-xs text-gray-600">
                  {inv.invoice_number}
                </td>
                <td className="px-3 py-2 text-gray-700">{inv.patient_name}</td>
                <td className="px-3 py-2 text-gray-700">
                  {inv.doctor_name ?? "—"}
                </td>
                <td className="px-3 py-2">
                  <InvoiceStatusBadge status={inv.status} />
                </td>
                <td className="px-3 py-2 text-end tabular-nums text-amber-700">
                  {formatMoney(num(inv.balance_due))}
                </td>
                <td className="px-3 py-2 text-end tabular-nums text-gray-500">
                  {formatDate(inv.last_payment_date)}
                </td>
                <td className="px-3 py-2 text-end tabular-nums text-gray-500">
                  {inv.age_days}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
