"use client";

import { useTranslations } from "next-intl";
import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useVisitMonthlyStats } from "@/features/visits/hooks/useVisitMonthlyStats";
import { ChartCard, SectionCard } from "./dashboard-cards";

type Props = {
  branchId?: string;
  orgId?: string;
  orgWide: boolean;
};

const VISITS_COLOR = "#11604C";
const FOLLOW_UPS_COLOR = "#AAB37D";

/** Daily attended visits vs follow-ups across the current month. */
export function DashboardVisitsChart({ branchId, orgId, orgWide }: Props) {
  const t = useTranslations("dashboardHome.overview");
  const { data, isLoading } = useVisitMonthlyStats(branchId, { orgWide, orgId });

  const rows = data?.daily ?? [];

  return (
    <SectionCard title={t("sections.visitTrend")}>
      {isLoading ? (
        <p className="py-12 text-center text-sm text-gray-400">…</p>
      ) : rows.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-400">{t("empty")}</p>
      ) : (
        <ChartCard>
          <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} width={40} allowDecimals={false} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="visits"
              name={t("chart.visits")}
              stroke={VISITS_COLOR}
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="follow_ups"
              name={t("chart.followUps")}
              stroke={FOLLOW_UPS_COLOR}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartCard>
      )}
    </SectionCard>
  );
}
