"use client";

import { useState } from "react";
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

import { cn } from "@/common/utils/utils";
import { Button } from "@/components/ui/button";

import { useFinancialReport } from "../hooks/useReports";
import { formatMoney } from "../lib/format";
import type {
  DailyRevenueReport,
  OutstandingInvoicesReport,
  PaymentsByMethodReport,
  ReportParams,
  ReportSummary,
  RevenueByDoctorReport,
  RevenueByServiceReport,
} from "../types/financial.types";
import { FinancialPageShell } from "./FinancialPageShell";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";

type Tab =
  | "revenue"
  | "daily"
  | "byService"
  | "byDoctor"
  | "byMethod"
  | "arAging"
  | "collections"
  | "writeOffs"
  | "outstanding";

const TABS: Tab[] = [
  "revenue",
  "daily",
  "byService",
  "byDoctor",
  "byMethod",
  "arAging",
  "collections",
  "writeOffs",
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

export function ReportsPage() {
  const t = useTranslations("financial.reports");
  const [tab, setTab] = useState<Tab>("revenue");
  const [fromInput, setFromInput] = useState("");
  const [toInput, setToInput] = useState("");
  const [params, setParams] = useState<ReportParams>({});

  function applyRange() {
    setParams({
      date_from: fromInput || undefined,
      date_to: toInput || undefined,
    });
  }

  return (
    <FinancialPageShell title={t("title")} subtitle={t("subtitle")}>
      <div className="flex flex-col gap-5">
        {/* Date range */}
        <div className="flex flex-wrap items-end gap-3">
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
          {TABS.map((key) => (
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
          {tab === "revenue" && <SummaryPanel name="revenue" params={params} />}
          {tab === "daily" && <DailyPanel params={params} />}
          {tab === "byService" && <ByServicePanel params={params} />}
          {tab === "byDoctor" && <ByDoctorPanel params={params} />}
          {tab === "byMethod" && <ByMethodPanel params={params} />}
          {tab === "arAging" && <SummaryPanel name="ar-aging" params={params} />}
          {tab === "collections" && (
            <SummaryPanel name="collections" params={params} />
          )}
          {tab === "writeOffs" && (
            <SummaryPanel name="write-offs" params={params} />
          )}
          {tab === "outstanding" && <OutstandingPanel params={params} />}
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
    </div>
  );
}

function ByMethodPanel({ params }: { params: ReportParams }) {
  const tMethod = useTranslations("financial.payments.method");
  const { data, isLoading } = useFinancialReport<PaymentsByMethodReport>(
    "payments-by-method",
    params,
  );
  if (isLoading) return <Loading />;
  if (!data || data.by_method.length === 0) return <Empty />;

  const chartData = data.by_method.map((r) => ({
    name: tMethod(r.payment_method),
    value: num(r.total),
  }));

  return (
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
              <th className="px-3 py-2 text-start font-medium">{t("status")}</th>
              <th className="px-3 py-2 text-end font-medium">{t("balance")}</th>
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
                <td className="px-3 py-2">
                  <InvoiceStatusBadge status={inv.status} />
                </td>
                <td className="px-3 py-2 text-end tabular-nums text-amber-700">
                  {formatMoney(num(inv.balance_due))}
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
