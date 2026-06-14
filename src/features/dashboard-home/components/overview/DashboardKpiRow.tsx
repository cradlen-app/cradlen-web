"use client";

import { CalendarCheck, Repeat, Users, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  StatTrendCard,
  StatTrendCardSkeleton,
  type StatMetric,
} from "@/components/common/StatTrendCard";
import {
  formatMoney,
  useFinancialReport,
  type ReportParams,
  type RevenueSummaryReport,
} from "@/core/financial";
import { usePatientStats } from "@/features/patients/hooks/usePatientStats";
import { useVisitMonthlyStats } from "@/features/visits/hooks/useVisitMonthlyStats";
import { num } from "./dashboard-cards";
import { currentMonthRange, previousMonthRange } from "./month-range";

type Props = {
  branchId?: string;
  orgId?: string;
  orgWide: boolean;
  /** Owners / branch managers: include the collected-revenue card. */
  showRevenue: boolean;
  /** Owners / managers / clinical staff: include the patients total. */
  showPatients: boolean;
  /** Doctor personal view: count only the viewer's own visits/patients. */
  mine?: boolean;
};

/**
 * Headline KPI row: attended visits + follow-ups this month (with MoM trend),
 * optionally the patient total and collected revenue. The set of cards adapts to
 * the viewer's role via the `show*` flags.
 */
export function DashboardKpiRow({
  branchId,
  orgId,
  orgWide,
  showRevenue,
  showPatients,
  mine = false,
}: Props) {
  const t = useTranslations("dashboardHome.overview");

  const visits = useVisitMonthlyStats(branchId, { orgWide, orgId, mine });
  const patients = usePatientStats(branchId, { orgWide, mine });

  // Collected revenue as a MoM flow: one report for this month, one for last.
  const branchParam: ReportParams = orgWide ? {} : { branch_id: branchId };
  const revCur = useFinancialReport<RevenueSummaryReport>(
    "revenue",
    { ...branchParam, ...currentMonthRange() },
    { enabled: showRevenue },
  );
  const revPrev = useFinancialReport<RevenueSummaryReport>(
    "revenue",
    { ...branchParam, ...previousMonthRange() },
    { enabled: showRevenue },
  );

  const vsLastMonth = t("vsLastMonth");
  const noPrior = t("noPrior");

  const loading =
    visits.isLoading ||
    (showPatients && patients.isLoading) ||
    (showRevenue && (revCur.isLoading || revPrev.isLoading));

  // 2 base cards (visits, follow-ups) + optional patients + revenue.
  const cardCount = 2 + (showPatients ? 1 : 0) + (showRevenue ? 1 : 0);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {Array.from({ length: cardCount }).map((_, i) => (
          <StatTrendCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const collected: StatMetric = {
    current: num(revCur.data?.total_collected),
    previous: num(revPrev.data?.total_collected),
  };

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      <StatTrendCard
        icon={CalendarCheck}
        label={t("kpi.visits")}
        metric={visits.data?.visits ?? { current: 0, previous: 0 }}
        accent
        vsLastMonthLabel={vsLastMonth}
        noPriorLabel={noPrior}
      />
      <StatTrendCard
        icon={Repeat}
        label={t("kpi.followUps")}
        metric={visits.data?.follow_ups ?? { current: 0, previous: 0 }}
        vsLastMonthLabel={vsLastMonth}
        noPriorLabel={noPrior}
      />
      {showPatients && (
        <StatTrendCard
          icon={Users}
          label={t("kpi.patients")}
          metric={patients.data?.total ?? { current: 0, previous: 0 }}
          vsLastMonthLabel={vsLastMonth}
          noPriorLabel={noPrior}
        />
      )}
      {showRevenue && (
        <StatTrendCard
          icon={Wallet}
          label={t("kpi.collected")}
          metric={collected}
          value={formatMoney(collected.current)}
          vsLastMonthLabel={vsLastMonth}
          noPriorLabel={noPrior}
        />
      )}
    </div>
  );
}
