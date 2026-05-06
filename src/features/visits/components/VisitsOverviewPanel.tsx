"use client";

import { useTranslations } from "next-intl";
import { MiniCalendar } from "./MiniCalendar";
import { TodaysScheduleCard } from "./TodaysScheduleCard";

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
  assignedToMe,
}: Props) {
  const t = useTranslations("visits");

  return (
    <aside className="w-full shrink-0 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm lg:w-full ">
      <p className="border-b border-gray-100 px-4 py-3 text-center text-sm font-semibold text-brand-black">
        {t("overviewTitle")}
      </p>

      <div className="border-b border-gray-100 p-4">
        <MiniCalendar selectedDate={selectedDate} onSelect={onSelect} bare />
      </div>

      <div className="p-4">
        <TodaysScheduleCard
          branchId={branchId}
          date={selectedDate}
          assignedToMe={assignedToMe}
          bare
        />
      </div>
    </aside>
  );
}
