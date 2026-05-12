"use client";

import { ClipboardList, HeartPulse, Repeat, Stethoscope } from "lucide-react";
import { useTranslations } from "next-intl";
import { useVisitStats } from "../hooks/useVisitStats";
import { cn } from "@/common/utils/utils";

type Props = {
  branchId: string;
  date: string;
  assignedToMe?: boolean;
};

const ICONS = {
  totalVisits: ClipboardList,
  visits: Stethoscope,
  followUps: Repeat,
  medicalReps: HeartPulse,
} as const;

type StatKey = keyof typeof ICONS;

const STAT_KEYS: StatKey[] = ["totalVisits", "visits", "followUps", "medicalReps"];

export function StatCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      {STAT_KEYS.map((key) => (
        <div
          key={key}
          className="flex flex-col gap-2 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <div className="size-6 animate-pulse rounded-full bg-gray-100" />
            <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
          </div>
          <div className="h-7 w-10 animate-pulse rounded bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

export function StatCards({ branchId, date, assignedToMe }: Props) {
  const t = useTranslations("dashboardHome.stats");
  const { data } = useVisitStats({ branchId, date, assignedToMe });

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      {STAT_KEYS.map((key, index) => {
        const Icon = ICONS[key];
        return (
          <div
            key={key}
            className={cn(
              "flex flex-col gap-2 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm",
              "transition-shadow hover:shadow-md",
            )}
          >
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
              <span
                className={cn(
                  "inline-flex size-6 items-center justify-center rounded-full",
                  index === 0
                    ? "bg-brand-primary/10 text-brand-primary"
                    : "bg-gray-50 text-gray-400",
                )}
              >
                <Icon className="size-3.5" aria-hidden="true" />
              </span>
              <span className="truncate">{t(key)}</span>
            </div>
            <div className="text-2xl font-semibold text-brand-black tabular-nums">
              {data[key]}
            </div>
          </div>
        );
      })}
    </div>
  );
}
