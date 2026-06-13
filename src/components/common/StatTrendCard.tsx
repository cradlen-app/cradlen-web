import {
  Minus,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/common/utils/utils";

/** A metric's value now vs. at the comparison baseline (start of / previous month). */
export type StatMetric = { current: number; previous: number };

/** Percent change vs. the baseline, or null when there's no prior value to compare. */
export function deltaPercent({ current, previous }: StatMetric): number | null {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

/** Green/red ▲▼ chip with the rounded percent change, or a neutral dash. */
export function TrendChip({
  metric,
  vsLabel,
  noPriorLabel,
}: {
  metric: StatMetric;
  /** Shown when there's no prior value (e.g. "no prior data"). */
  noPriorLabel: string;
  /** Trailing caption (e.g. "vs last month") — rendered by the card, not here. */
  vsLabel?: string;
}) {
  const delta = deltaPercent(metric);

  if (delta === null || Math.round(delta) === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400">
        <Minus className="size-3.5" aria-hidden="true" />
        {delta === null ? noPriorLabel : "0%"}
        {vsLabel ? <span className="sr-only"> {vsLabel}</span> : null}
      </span>
    );
  }

  const up = delta > 0;
  const Icon = up ? TrendingUp : TrendingDown;
  const rounded = Math.round(delta);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-semibold tabular-nums",
        up ? "text-emerald-600" : "text-red-500",
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {up ? "+" : ""}
      {rounded}%
    </span>
  );
}

/**
 * Shared analytics card: icon chip + label + value + a month-over-month trend
 * chip. Used by the patients/staff stat grids and the dashboard KPI row. The
 * trend strings are passed in so each caller keeps its own i18n namespace.
 */
export function StatTrendCard({
  icon: Icon,
  label,
  metric,
  accent,
  vsLastMonthLabel,
  noPriorLabel,
  value,
}: {
  icon: LucideIcon;
  label: string;
  metric: StatMetric;
  accent?: boolean;
  vsLastMonthLabel: string;
  noPriorLabel: string;
  /** Display override for the headline figure (e.g. formatted money). Defaults to `metric.current`. */
  value?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-2xl border border-gray-100 bg-white px-3 py-2 shadow-sm",
        "transition-shadow hover:shadow-md",
      )}
    >
      <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
        <span
          className={cn(
            "inline-flex size-5 items-center justify-center rounded-full",
            accent
              ? "bg-brand-primary/10 text-brand-primary"
              : "bg-gray-50 text-gray-400",
          )}
        >
          <Icon className="size-3" aria-hidden="true" />
        </span>
        <span className="truncate">{label}</span>
      </div>
      <div className="text-xl font-semibold tabular-nums text-brand-black">
        {value ?? metric.current}
      </div>
      <div className="flex items-center gap-1">
        <TrendChip metric={metric} noPriorLabel={noPriorLabel} />
        <span className="truncate text-[11px] text-gray-400">
          {vsLastMonthLabel}
        </span>
      </div>
    </div>
  );
}

/** Single-card loading skeleton matching {@link StatTrendCard}. */
export function StatTrendCardSkeleton() {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-gray-100 bg-white px-3 py-2 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="size-5 animate-pulse rounded-full bg-gray-100" />
        <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
      </div>
      <div className="h-6 w-12 animate-pulse rounded bg-gray-100" />
      <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
    </div>
  );
}
