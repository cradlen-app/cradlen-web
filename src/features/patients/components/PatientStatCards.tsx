"use client";

import {
  Activity,
  Baby,
  Minus,
  Route,
  Scissors,
  Stethoscope,
  TrendingDown,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/common/utils/utils";
import type {
  ApiJourneyType,
  ApiPatientStatMetric,
} from "@/features/visits/types/visits.api.types";
import { usePatientStats } from "../hooks/usePatientStats";

type Props = {
  branchId?: string;
  orgWide: boolean;
};

/** Icon hint per known journey type; unknown/new types fall back to a generic icon. */
const TYPE_ICONS: Partial<Record<ApiJourneyType, LucideIcon>> = {
  PREGNANCY: Baby,
  GENERAL_GYN: Stethoscope,
  SURGICAL: Scissors,
  CHRONIC_CONDITION: Activity,
};

function iconForType(type: ApiJourneyType): LucideIcon {
  return TYPE_ICONS[type] ?? Route;
}

/** Percent change vs. last month, or null when there's no prior value to compare. */
function deltaPercent({ current, previous }: ApiPatientStatMetric): number | null {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

function TrendChip({ metric }: { metric: ApiPatientStatMetric }) {
  const t = useTranslations("patients.stats");
  const delta = deltaPercent(metric);

  if (delta === null || Math.round(delta) === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400">
        <Minus className="size-3.5" aria-hidden="true" />
        {delta === null ? t("noPrior") : "0%"}
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

function MetricCard({
  icon: Icon,
  label,
  metric,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  metric: ApiPatientStatMetric;
  accent?: boolean;
}) {
  const t = useTranslations("patients.stats");
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
        {metric.current}
      </div>
      <div className="flex items-center gap-1">
        <TrendChip metric={metric} />
        <span className="truncate text-[11px] text-gray-400">
          {t("vsLastMonth")}
        </span>
      </div>
    </div>
  );
}

export function PatientStatCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-1 rounded-2xl border border-gray-100 bg-white px-3 py-2 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <div className="size-5 animate-pulse rounded-full bg-gray-100" />
            <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
          </div>
          <div className="h-6 w-12 animate-pulse rounded bg-gray-100" />
          <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

/**
 * Analytics cards above the patients table: a total plus one card per care-path
 * journey present in the data (specialty-agnostic — labels come from the API),
 * each with a month-over-month trend chip.
 */
export function PatientStatCards({ branchId, orgWide }: Props) {
  const t = useTranslations("patients.stats");
  const { data, isLoading } = usePatientStats(branchId, { orgWide });

  if (isLoading) return <PatientStatCardsSkeleton />;
  if (!data) return null;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
      <MetricCard icon={Users} label={t("total")} metric={data.total} accent />
      {data.by_care_path.map((cp) => (
        <MetricCard
          key={cp.journey_template_id}
          icon={iconForType(cp.type)}
          label={cp.name}
          metric={cp}
        />
      ))}
    </div>
  );
}
