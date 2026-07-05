"use client";

import {
  AlertCircle,
  CheckCircle2,
  CircleDashed,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/common/utils/utils";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";

import { useFinancialReport } from "../hooks/useReports";
import { formatMoney } from "../lib/format";
import type { InvoiceStatsReport } from "../types/financial.types";

type StatKey = keyof InvoiceStatsReport;

const STAT_KEYS: StatKey[] = ["paid", "unpaid", "pending", "overdue"];

/** Per-status icon + accent (chip background / icon color). */
const STAT_META: Record<StatKey, { icon: LucideIcon; chip: string }> = {
  paid: { icon: CheckCircle2, chip: "bg-emerald-50 text-emerald-600" },
  unpaid: { icon: Clock, chip: "bg-amber-50 text-amber-600" },
  pending: { icon: CircleDashed, chip: "bg-gray-100 text-gray-500" },
  overdue: { icon: AlertCircle, chip: "bg-red-50 text-red-600" },
};

/** Coerce a Decimal string from the report into a finite number. */
function num(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function InvoiceStatCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      {STAT_KEYS.map((key) => (
        <div
          key={key}
          className="flex flex-col gap-2 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <div className="size-9 animate-pulse rounded-xl bg-gray-100" />
            <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
          </div>
          <div className="mt-1 h-7 w-28 animate-pulse rounded bg-gray-100" />
          <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

/**
 * Status-rollup cards for the invoices dashboard: Paid / Unpaid / Pending /
 * Overdue, each showing the summed amount and the invoice count. Data comes
 * from the backend `invoice-stats` report (branch-scoped).
 */
export function InvoiceStatCards() {
  const t = useTranslations("financial.invoices.stats");
  const branchId = useAuthContextStore((s) => s.branchId);
  const { data, isLoading, error } = useFinancialReport<InvoiceStatsReport>(
    "invoice-stats",
    branchId ? { branch_id: branchId } : undefined,
  );

  // Fail closed rather than spinning forever: if the report errors (e.g. a
  // permission mismatch on the endpoint), render nothing instead of a skeleton
  // that never resolves.
  if (error) return null;
  if (isLoading || !data) return <InvoiceStatCardsSkeleton />;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      {STAT_KEYS.map((key) => {
        const { icon: Icon, chip } = STAT_META[key];
        const bucket = data[key];
        return (
          <div
            key={key}
            className={cn(
              "flex flex-col gap-1.5 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm",
              "transition-shadow hover:shadow-md",
            )}
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex size-9 shrink-0 items-center justify-center rounded-xl",
                  chip,
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <span className="truncate text-xs font-medium text-gray-500">
                {t(key)}
              </span>
            </div>
            <div className="text-xl font-semibold tabular-nums text-brand-black">
              {formatMoney(num(bucket.amount))}
            </div>
            <p className="text-[11px] text-gray-400">
              {t("fromInvoices", { count: bucket.count })}
            </p>
          </div>
        );
      })}
    </div>
  );
}
