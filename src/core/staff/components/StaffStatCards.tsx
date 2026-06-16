"use client";

import { Briefcase, Stethoscope, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  StatTrendCard,
  StatTrendCardSkeleton,
} from "@/components/common/StatTrendCard";
import { useStaffStats } from "../hooks/useStaffStats";

type Props = {
  organizationId?: string;
  branchId?: string;
};

export function StaffStatCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <StatTrendCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Analytics cards above the staff table: a fixed set of three — total members,
 * clinical staff, and administrative (non-clinical) staff, each with a
 * month-over-month trend chip.
 */
export function StaffStatCards({ organizationId, branchId }: Props) {
  const t = useTranslations("staff");
  const { data, isLoading } = useStaffStats(organizationId, branchId);

  if (isLoading) return <StaffStatCardsSkeleton />;
  if (!data) return null;

  const vsLastMonth = t("stats.vsLastMonth");
  const noPrior = t("stats.noPrior");

  // Administrative = every active member without a clinical job function. Clinical
  // is a subset of total, so this is exact and never negative.
  const administrative = {
    current: data.total.current - data.clinical.current,
    previous: data.total.previous - data.clinical.previous,
  };

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-3">
      <StatTrendCard
        icon={Users}
        label={t("stats.total")}
        metric={data.total}
        accent
        vsLastMonthLabel={vsLastMonth}
        noPriorLabel={noPrior}
      />
      <StatTrendCard
        icon={Stethoscope}
        label={t("stats.clinical")}
        metric={data.clinical}
        vsLastMonthLabel={vsLastMonth}
        noPriorLabel={noPrior}
      />
      <StatTrendCard
        icon={Briefcase}
        label={t("stats.administrative")}
        metric={administrative}
        vsLastMonthLabel={vsLastMonth}
        noPriorLabel={noPrior}
      />
    </div>
  );
}
