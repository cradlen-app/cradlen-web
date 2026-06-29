"use client";

import type { ReactElement, ReactNode } from "react";
import { ResponsiveContainer } from "recharts";
import { useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/common/utils/utils";
import { formatMoney } from "../lib/format";

/**
 * Shared presentational primitives and constants for the financial reports
 * dashboard, used by ReportsPage's panels (see ./report-panels). Pure UI — no
 * data fetching.
 */

export const CHART_COLORS = [
  "#11604C",
  "#AAB37D",
  "#3b82f6",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
];

export function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function Loading() {
  const t = useTranslations("financial.reports");
  return <p className="py-12 text-center text-sm text-gray-400">{t("loading")}</p>;
}

export function Empty() {
  const t = useTranslations("financial.reports");
  return <p className="py-12 text-center text-sm text-gray-400">{t("noData")}</p>;
}

export function ChartCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-100 p-4">
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {children as ReactElement}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function StatCard({ label, value }: { label: string; value: string }) {
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
export function SimpleTable({
  headers,
  rows,
  alignEnd = [],
}: {
  headers: string[];
  rows: ReactNode[][];
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
export function KpiCard({
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
export function SectionCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-100 p-4">
      <h3 className="mb-3 text-sm font-medium text-gray-700">{title}</h3>
      {children}
    </div>
  );
}

/** Ranked rows with a proportional bar (longest = highest amount). */
export function RankedBars({ rows }: { rows: { label: string; amount: number }[] }) {
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

export function KpiSkeleton() {
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
