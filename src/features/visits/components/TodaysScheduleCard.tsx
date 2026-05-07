"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useTodaysSchedule } from "../hooks/useTodaysSchedule";
import { formatTimeRange } from "../lib/visits.utils";
import type { ScheduleEvent, ScheduleEventKind } from "../types/visits.types";

type Props = {
  branchId: string | null | undefined;
  date: string;
  assignedToMe?: boolean;
  bare?: boolean;
};

const KIND_BAR: Record<ScheduleEventKind, string> = {
  visit: "bg-red-400",
  appointment: "bg-amber-400",
  meeting: "bg-brand-primary",
  break: "bg-gray-300",
};

const KIND_BG: Record<ScheduleEventKind, string> = {
  visit: "bg-red-50/40",
  appointment: "bg-amber-50/40",
  meeting: "bg-brand-primary/5",
  break: "bg-gray-50",
};

type ScheduleEntryProps = {
  event: ScheduleEvent;
  t: ReturnType<typeof useTranslations>;
};

function ScheduleEntry({ event, t }: ScheduleEntryProps) {
  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-xl border border-gray-100 ps-4 pe-3 py-3",
        KIND_BG[event.kind],
      )}
    >
      <span
        className={cn(
          "absolute inset-y-2 inset-s-1.5 w-1 rounded-full",
          KIND_BAR[event.kind],
        )}
        aria-hidden="true"
      />
      <p className="text-[13px] font-semibold text-brand-black truncate">
        {event.title}
      </p>
      <p className="mt-0.5 text-[11px] text-gray-500 tabular-nums">
        {formatTimeRange(event.startTime, event.endTime)}
      </p>
      {event.patientName && (
        <p className="mt-1.5 text-[11px] text-gray-500 truncate">
          <span className="text-gray-400">{t("patientLabel")}: </span>
          <span className="text-brand-black">{event.patientName}</span>
        </p>
      )}
      {event.doctorNames?.length ? (
        <p className="mt-0.5 text-[11px] text-gray-500 truncate">
          <span className="text-gray-400">{t("assignedLabel")}: </span>
          <span className="text-brand-black">
            {event.doctorNames.join(", ")}
          </span>
        </p>
      ) : null}
      {event.notes && (
        <p className="mt-1.5 text-[11px] text-gray-500 truncate">
          {event.notes}
        </p>
      )}
    </article>
  );
}

export function TodaysScheduleCard({
  branchId,
  date,
  assignedToMe,
  bare,
}: Props) {
  const t = useTranslations("dashboardHome.schedule");
  const { data, isLoading, isError } = useTodaysSchedule({
    branchId,
    date,
    assignedToMe,
  });

  const inner = (
    <>
      <header className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-brand-black">{t("title")}</h2>
      </header>

      <div className="space-y-2.5">
        {isLoading ? (
          <>
            <div className="h-20 animate-pulse rounded-xl bg-gray-50" />
            <div className="h-20 animate-pulse rounded-xl bg-gray-50" />
            <div className="h-20 animate-pulse rounded-xl bg-gray-50" />
          </>
        ) : isError ? (
          <p className="text-sm text-red-500">{t("loadError")}</p>
        ) : data && data.length > 0 ? (
          data.map((event) => (
            <ScheduleEntry key={event.id} event={event} t={t} />
          ))
        ) : (
          <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50/40 px-3 py-6 text-center text-xs text-gray-400">
            {t("empty")}
          </p>
        )}
      </div>
    </>
  );

  if (bare) return inner;

  return (
    <section
      aria-label={t("title")}
      className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
    >
      {inner}
    </section>
  );
}
