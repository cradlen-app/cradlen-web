"use client";

import { Building2, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/common/utils/utils";
import { useCalendarEvents } from "../hooks/useCalendarEvents";
import {
  formatEventTime,
  localIsoDate,
} from "../lib/calendar.utils";
import { TYPE_BAR_CLASS } from "./CalendarEventChip";
import type { CalendarEvent, CalendarEventType } from "../types/calendar.types";

const TYPE_BG: Record<CalendarEventType, string> = {
  DAY_OFF: "bg-amber-50/40",
  PROCEDURE: "bg-red-50/40",
  MEETING: "bg-brand-primary/5",
  GENERIC: "bg-gray-50",
};

type Props = {
  /** ISO date string YYYY-MM-DD */
  date: string;
  branchId?: string;
  bare?: boolean;
};

function dayWindow(date: string) {
  const [yyyy, mm, dd] = date.split("-").map(Number);
  const from = new Date(yyyy, mm - 1, dd, 0, 0, 0, 0).toISOString();
  const to = new Date(yyyy, mm - 1, dd, 23, 59, 59, 999).toISOString();
  return { from, to };
}

function EventEntry({ event }: { event: CalendarEvent }) {
  const t = useTranslations("calendar");

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-xl border border-gray-100 ps-4 pe-3 py-3",
        TYPE_BG[event.type],
      )}
    >
      <span
        className={cn(
          "absolute inset-y-2 inset-s-1.5 w-1 rounded-full",
          TYPE_BAR_CLASS[event.type],
        )}
        aria-hidden="true"
      />

      <div className="flex items-center gap-1.5">
        <p className="truncate text-[13px] font-semibold text-brand-black">
          {event.title}
        </p>
        {event.visibility === "PRIVATE" ? (
          <Lock
            className="size-3 shrink-0 text-gray-400"
            aria-label={t("visibility.PRIVATE")}
          />
        ) : (
          <Building2
            className="size-3 shrink-0 text-gray-400"
            aria-label={t("visibility.ORGANIZATION")}
          />
        )}
      </div>

      <p className="mt-0.5 text-[11px] text-gray-500">
        {t(`types.${event.type}`)}
        {event.procedureName ? ` · ${event.procedureName}` : ""}
      </p>

      <p className="mt-0.5 text-[11px] tabular-nums text-gray-500">
        {event.allDay
          ? t("allDay")
          : formatEventTime(event.startsAt, event.endsAt)}
      </p>

      {event.patientName && (
        <p className="mt-1 truncate text-[11px] text-gray-500">
          <span className="text-gray-400">{t("patientLabel")}: </span>
          <span className="text-brand-black">{event.patientName}</span>
        </p>
      )}

      {event.assistants.length > 0 && (
        <p className="mt-0.5 truncate text-[11px] text-gray-500">
          <span className="text-gray-400">{t("form.assistants")}: </span>
          <span className="text-brand-black">
            {event.assistants.map((a) => a.fullName).join(", ")}
          </span>
        </p>
      )}
    </article>
  );
}

export function TodaysCalendarCardSkeleton({ bare }: { bare?: boolean }) {
  const inner = (
    <>
      <div className="mb-3 h-4 w-32 animate-pulse rounded bg-gray-200" />
      <div className="space-y-2.5">
        <div className="h-16 animate-pulse rounded-xl bg-gray-50" />
        <div className="h-16 animate-pulse rounded-xl bg-gray-50" />
      </div>
    </>
  );

  if (bare) return inner;

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      {inner}
    </section>
  );
}

export function TodaysCalendarCard({ date, branchId, bare }: Props) {
  const t = useTranslations("calendar");
  const { from, to } = dayWindow(date);
  const { data: events } = useCalendarEvents({ branchId, from, to });

  // Defensive: the window catches overlaps; trim to events touching this date.
  const dayEvents = events.filter((e) => {
    const start = localIsoDate(e.startsAt);
    const end = localIsoDate(e.endsAt);
    return start <= date && date <= end;
  });

  const inner = (
    <>
      <header className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-brand-black">
          {t("todaysCalendar")}
        </h2>
      </header>

      <div className="space-y-2.5">
        {dayEvents.length > 0 ? (
          dayEvents.map((event) => <EventEntry key={event.id} event={event} />)
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
      aria-label={t("todaysCalendar")}
      className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
    >
      {inner}
    </section>
  );
}
