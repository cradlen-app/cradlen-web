"use client";

import type { ReactElement, ReactNode } from "react";
import { ResponsiveContainer } from "recharts";
import { formatMoney } from "@/core/financial";

/** Coerce a string|number|unknown into a finite number (financial rows are strings). */
export function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Titled bordered card wrapper for a dashboard widget. */
export function SectionCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-gray-700">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Fixed-height responsive chart wrapper (mirrors the financial reports). */
export function ChartCard({ children }: { children: ReactNode }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        {children as ReactElement}
      </ResponsiveContainer>
    </div>
  );
}

/** Ranked rows with a proportional bar (longest = highest amount). */
export function RankedBars({
  rows,
  emptyLabel,
}: {
  rows: { label: string; amount: number }[];
  emptyLabel: string;
}) {
  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-400">{emptyLabel}</p>;
  }
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
