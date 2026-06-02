"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ReferenceArea,
  CartesianGrid,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { ApiVitalsTrendPoint } from "../../../types/visits.api.types";

const chartConfig = {
  systolic: {
    label: "Systolic",
    color: "#ef4444",
  },
  diastolic: {
    label: "Diastolic",
    color: "#3b82f6",
  },
} satisfies ChartConfig;

type Props = {
  points: ApiVitalsTrendPoint[];
  emptyLabel: string;
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function BpTrendChart({ points, emptyLabel }: Props) {
  // `i` is a unique x category (the row index) so recharts' active-index hover
  // tracking stays stable even when several visits fall on the same day; the
  // readable date is carried separately as `label` for ticks + the tooltip.
  const data = points.map((p, i) => ({
    i,
    label: formatDate(p.completed_at),
    systolic: p.systolic_bp,
    diastolic: p.diastolic_bp,
  }));

  const hasData = data.some((d) => d.systolic != null || d.diastolic != null);

  if (!hasData) {
    return (
      <p className="py-6 text-center text-xs text-gray-400">{emptyLabel}</p>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[160px] w-full">
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        {/* Normal zone ≤ 80 diastolic */}
        <ReferenceArea y1={0} y2={80} fill="#dcfce7" fillOpacity={0.25} />
        {/* Stage 1 HBP: systolic 130–140 */}
        <ReferenceArea y1={130} y2={140} fill="#fef9c3" fillOpacity={0.4} />
        {/* Stage 2 HBP: ≥ 140 */}
        <ReferenceArea y1={140} y2={210} fill="#fee2e2" fillOpacity={0.35} />
        <XAxis
          dataKey="i"
          tick={{ fontSize: 10 }}
          tickFormatter={(v: number) => data[v]?.label ?? ""}
        />
        <YAxis tick={{ fontSize: 10 }} domain={[40, 210]} />
        <ChartTooltip
          cursor={{ stroke: "#cbd5e1", strokeWidth: 1 }}
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) =>
                (payload?.[0]?.payload as { label?: string } | undefined)?.label ?? ""
              }
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          type="monotone"
          dataKey="systolic"
          stroke="var(--color-systolic)"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="diastolic"
          stroke="var(--color-diastolic)"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ChartContainer>
  );
}
