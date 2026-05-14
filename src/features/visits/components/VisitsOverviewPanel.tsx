"use client";

import { Suspense } from "react";
import { useTranslations } from "next-intl";
import {
  TodaysCalendarCard,
  TodaysCalendarCardSkeleton,
} from "@/features/calendar/components/TodaysCalendarCard";
import { MiniCalendar } from "./MiniCalendar";

type Props = {
  branchId: string | null | undefined;
  selectedDate: string;
  onSelect: (date: string) => void;
  assignedToMe?: boolean;
};

export function VisitsOverviewPanel({
  branchId,
  selectedDate,
  onSelect,
}: Props) {
  const t = useTranslations("visits");

  return (
    <aside className="w-full shrink-0 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm lg:flex lg:flex-col lg:h-[calc(100vh-15rem)]">
      <p className="border-b border-gray-100 px-4 py-3 text-center text-sm font-semibold text-brand-black shrink-0">
        {t("overviewTitle")}
      </p>

      <div className="border-b border-gray-100 p-4 shrink-0">
        <MiniCalendar selectedDate={selectedDate} onSelect={onSelect} bare />
      </div>

      <div className="p-4 lg:flex-1 lg:min-h-0 lg:overflow-y-auto">
        <Suspense fallback={<TodaysCalendarCardSkeleton bare />}>
          <TodaysCalendarCard
            date={selectedDate}
            branchId={branchId ?? undefined}
            bare
          />
        </Suspense>
      </div>
    </aside>
  );
}
