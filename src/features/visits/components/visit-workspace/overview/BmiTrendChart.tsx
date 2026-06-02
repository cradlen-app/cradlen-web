"use client";

import { LineChart, Line, XAxis, YAxis, ReferenceArea, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import type { ApiVitalsTrendPoint } from "../../../types/visits.api.types";

const chartConfig = {
  bmi: {
    label: "BMI",
    color: "#8b5cf6",
  },
} satisfies ChartConfig;

type Props = {
  points: ApiVitalsTrendPoint[];
  emptyLabel: string;
};

type ChartPoint = {
  i: number;
  label: string;
  bmi: number | null;
  weight_kg: number | null;
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function CustomTooltipContent({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartPoint }>;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded border border-gray-200 bg-white px-2 py-1 text-xs shadow">
      <p className="font-medium text-gray-700">{p.label}</p>
      {p.bmi != null && <p>BMI: {p.bmi.toFixed(1)}</p>}
      {p.weight_kg != null && <p>Weight: {p.weight_kg} kg</p>}
    </div>
  );
}

export function BmiTrendChart({ points, emptyLabel }: Props) {
  // `i` is a unique x category so hover tracking stays stable across same-day
  // visits; the readable date is carried as `label` for ticks + the tooltip.
  const data: ChartPoint[] = points.map((p, i) => ({
    i,
    label: formatDate(p.completed_at),
    bmi: p.bmi,
    weight_kg: p.weight_kg,
  }));

  const hasData = data.some((d) => d.bmi != null);

  if (!hasData) {
    return (
      <p className="py-6 text-center text-xs text-gray-400">{emptyLabel}</p>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[160px] w-full">
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        {/* Underweight: < 18.5 */}
        <ReferenceArea y1={10} y2={18.5} fill="#dbeafe" fillOpacity={0.35} />
        {/* Normal: 18.5–24.9 */}
        <ReferenceArea y1={18.5} y2={24.9} fill="#dcfce7" fillOpacity={0.35} />
        {/* Overweight: 25–29.9 */}
        <ReferenceArea y1={25} y2={30} fill="#fef9c3" fillOpacity={0.45} />
        {/* Obese: ≥ 30 */}
        <ReferenceArea y1={30} y2={50} fill="#fee2e2" fillOpacity={0.35} />
        <XAxis
          dataKey="i"
          tick={{ fontSize: 10 }}
          tickFormatter={(v: number) => data[v]?.label ?? ""}
        />
        <YAxis tick={{ fontSize: 10 }} domain={[10, 50]} />
        <ChartTooltip
          cursor={{ stroke: "#cbd5e1", strokeWidth: 1 }}
          content={<CustomTooltipContent />}
        />
        <Line
          type="monotone"
          dataKey="bmi"
          stroke="var(--color-bmi)"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ChartContainer>
  );
}
