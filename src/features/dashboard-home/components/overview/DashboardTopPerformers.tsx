"use client";

import { useTranslations } from "next-intl";
import {
  useFinancialReport,
  type ReportParams,
  type RevenueByDoctorReport,
  type RevenueByServiceReport,
} from "@/core/financial";
import { RankedBars, SectionCard, num } from "./dashboard-cards";
import { currentMonthRange } from "./month-range";

type Props = {
  branchId?: string;
  orgWide: boolean;
};

/** Top doctors and top services by revenue this month (ranked bars). */
export function DashboardTopPerformers({ branchId, orgWide }: Props) {
  const t = useTranslations("dashboardHome.overview");

  const params: ReportParams = {
    ...(orgWide ? {} : { branch_id: branchId }),
    ...currentMonthRange(),
  };

  const byDoctor = useFinancialReport<RevenueByDoctorReport>(
    "revenue-by-doctor",
    params,
  );
  const byService = useFinancialReport<RevenueByServiceReport>(
    "revenue-by-service",
    params,
  );

  const topDoctors = [...(byDoctor.data?.by_doctor ?? [])]
    .map((r) => ({ label: r.doctor_name, amount: num(r.total) }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const topServices = [...(byService.data?.by_service ?? [])]
    .map((r) => ({ label: r.service_name, amount: num(r.total) }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <SectionCard title={t("sections.topDoctors")}>
        <RankedBars rows={topDoctors} emptyLabel={t("empty")} />
      </SectionCard>
      <SectionCard title={t("sections.topServices")}>
        <RankedBars rows={topServices} emptyLabel={t("empty")} />
      </SectionCard>
    </div>
  );
}
