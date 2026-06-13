"use client";

import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Link } from "@/i18n/navigation";
import { useDashboardPath } from "@/hooks/useDashboardPath";
import {
  formatMoney,
  formatPercent,
  useFinancialReport,
  type DailyRevenueReport,
  type ReportParams,
  type RevenueSummaryReport,
} from "@/core/financial";
import { ChartCard, SectionCard, num } from "./dashboard-cards";
import { currentMonthRange } from "./month-range";

type Props = {
  branchId?: string;
  orgWide: boolean;
};

const INVOICED_COLOR = "#11604C";
const COLLECTED_COLOR = "#AAB37D";

function MiniKpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-100 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-base font-semibold tabular-nums text-gray-900">
        {value}
      </p>
    </div>
  );
}

/** This-month revenue snapshot: KPI tiles + an invoiced-vs-collected trend line. */
export function DashboardFinancialOverview({ branchId, orgWide }: Props) {
  const t = useTranslations("dashboardHome.overview");
  const dashboardPath = useDashboardPath();

  const params: ReportParams = {
    ...(orgWide ? {} : { branch_id: branchId }),
    ...currentMonthRange(),
  };

  const revenue = useFinancialReport<RevenueSummaryReport>("revenue", params);
  const daily = useFinancialReport<DailyRevenueReport>("daily-revenue", params);

  const invoiced = num(revenue.data?.total_invoiced);
  const collected = num(revenue.data?.total_collected);
  const rate = invoiced > 0 ? (collected / invoiced) * 100 : 0;

  const trend = (daily.data?.rows ?? []).map((r) => ({
    date: r.date,
    invoiced: num(r.invoiced),
    collected: num(r.collected),
  }));

  return (
    <SectionCard
      title={t("sections.financial")}
      action={
        <Link
          href={dashboardPath("/financial/reports")}
          className="inline-flex items-center gap-1 text-xs font-medium text-brand-primary hover:underline"
        >
          {t("viewFullReports")}
          <ArrowRight className="size-3.5 rtl:rotate-180" aria-hidden="true" />
        </Link>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <MiniKpi label={t("financial.invoiced")} value={formatMoney(invoiced)} />
          <MiniKpi label={t("financial.collected")} value={formatMoney(collected)} />
          <MiniKpi
            label={t("financial.outstanding")}
            value={formatMoney(num(revenue.data?.outstanding))}
          />
          <MiniKpi
            label={t("financial.collectionRate")}
            value={formatPercent(rate)}
          />
        </div>
        {daily.isLoading ? (
          <p className="py-8 text-center text-sm text-gray-400">…</p>
        ) : trend.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">{t("empty")}</p>
        ) : (
          <ChartCard>
            <LineChart data={trend} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={56} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="invoiced"
                name={t("financial.invoiced")}
                stroke={INVOICED_COLOR}
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="collected"
                name={t("financial.collected")}
                stroke={COLLECTED_COLOR}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartCard>
        )}
      </div>
    </SectionCard>
  );
}
