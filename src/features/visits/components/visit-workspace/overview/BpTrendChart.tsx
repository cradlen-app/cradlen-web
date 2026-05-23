"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceArea,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { ApiVitalsTrendPoint } from "../../../types/visits.api.types";

type Props = {
  points: ApiVitalsTrendPoint[];
  emptyLabel: string;
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function BpTrendChart({ points, emptyLabel }: Props) {
  const data = points.map((p) => ({
    date: formatDate(p.completed_at),
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
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        {/* Normal zone: systolic ≤ 120, diastolic ≤ 80 */}
        <ReferenceArea y1={0} y2={80} fill="#dcfce7" fillOpacity={0.25} />
        {/* Stage 1 HBP: 130–139 / 80–89 */}
        <ReferenceArea y1={130} y2={140} fill="#fef9c3" fillOpacity={0.4} />
        {/* Stage 2 HBP: ≥ 140 */}
        <ReferenceArea y1={140} y2={210} fill="#fee2e2" fillOpacity={0.35} />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} domain={[40, 210]} />
        <Tooltip
          contentStyle={{ fontSize: 11 }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any, name: any) =>
            value != null ? [`${value} mmHg`, name] : ["—", name]
          }
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Line
          type="monotone"
          dataKey="systolic"
          name="Systolic"
          stroke="#ef4444"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
        <Line
          type="monotone"
          dataKey="diastolic"
          name="Diastolic"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
