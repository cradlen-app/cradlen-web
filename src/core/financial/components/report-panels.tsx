"use client";

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
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertCircle, FileText, Percent, Wallet } from "lucide-react";
import { cn } from "@/common/utils/utils";
import { useFinancialReport } from "../hooks/useReports";
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
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import {
  CHART_COLORS,
  ChartCard,
  Empty,
  KpiCard,
  KpiSkeleton,
  Loading,
  num,
  RankedBars,
  SectionCard,
  SimpleTable,
  StatCard,
} from "./report-ui";

/** Per-tab financial report panels for ReportsPage. Each fetches its own data. */

/** Compose the financial reports into an at-a-glance overview dashboard. */
export function OverviewPanel({
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
export function ArAgingPanel({ params }: { params: ReportParams }) {
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
export function CollectionsPanel({ params }: { params: ReportParams }) {
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
export function SummaryPanel({ name, params }: { name: string; params: ReportParams }) {
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

export function DailyPanel({ params }: { params: ReportParams }) {
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

export function ByServicePanel({ params }: { params: ReportParams }) {
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

export function ByDoctorPanel({ params }: { params: ReportParams }) {
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
export function ByBranchPanel({ params }: { params: ReportParams }) {
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

export function ByMethodPanel({ params }: { params: ReportParams }) {
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

export function OutstandingPanel({ params }: { params: ReportParams }) {
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
