"use client";

import {
  Activity,
  Baby,
  Route,
  Scissors,
  Stethoscope,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  StatTrendCard,
  StatTrendCardSkeleton,
} from "@/components/common/StatTrendCard";
import type { ApiJourneyType } from "@/features/visits/types/visits.api.types";
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

export function PatientStatCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <StatTrendCardSkeleton key={i} />
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

  const vsLastMonth = t("vsLastMonth");
  const noPrior = t("noPrior");

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
      <StatTrendCard
        icon={Users}
        label={t("total")}
        metric={data.total}
        accent
        vsLastMonthLabel={vsLastMonth}
        noPriorLabel={noPrior}
      />
      {data.by_care_path.map((cp) => (
        <StatTrendCard
          key={cp.journey_template_id}
          icon={iconForType(cp.type)}
          label={cp.name}
          metric={cp}
          vsLastMonthLabel={vsLastMonth}
          noPriorLabel={noPrior}
        />
      ))}
    </div>
  );
}
