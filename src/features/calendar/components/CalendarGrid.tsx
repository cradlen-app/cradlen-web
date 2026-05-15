"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/common/utils/utils";
import {
  buildMonthGrid,
  groupEventsByDate,
  localIsoDate,
  todayIso,
} from "../lib/calendar.utils";
import { CalendarEventChip } from "./CalendarEventChip";
import type { CalendarEvent } from "../types/calendar.types";

const MAX_CHIPS = 3;

type Props = {
  events: CalendarEvent[];
  selectedDate: string;
  viewYear: number;
  viewMonth: number;
  onSelectDate: (date: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
};

export function CalendarGrid({
  events,
  selectedDate,
  viewYear,
  viewMonth,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
}: Props) {
  const locale = useLocale();
  const t = useTranslations("calendar");
  const weekStartsOn: 0 | 6 = locale === "ar" ? 6 : 0;

  const cells = useMemo(
    () => buildMonthGrid(viewYear, viewMonth, weekStartsOn),
    [viewYear, viewMonth, weekStartsOn],
  );

  const grouped = useMemo(() => groupEventsByDate(events), [events]);

  const today = todayIso();

  const monthLabel = useMemo(() => {
    return new Intl.DateTimeFormat(locale, {
      month: "long",
      year: "numeric",
    }).format(new Date(viewYear, viewMonth, 1));
  }, [locale, viewYear, viewMonth]);

  const weekdayLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { weekday: "short" });
    const labels: string[] = [];
    const reference = new Date(2024, 0, 7);
    for (let i = 0; i < 7; i++) {
      const d = new Date(reference);
      d.setDate(reference.getDate() + ((weekStartsOn + i) % 7));
      labels.push(formatter.format(d));
    }
    return labels;
  }, [locale, weekStartsOn]);

  return (
    <section className="flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden lg:h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
        <button
          type="button"
          onClick={onPrevMonth}
          className="inline-flex size-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-50 hover:text-brand-black transition-colors rtl:rotate-180"
          aria-label="Previous month"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 text-brand-primary" aria-hidden />
          <span className="text-sm font-semibold text-brand-black capitalize">
            {monthLabel}
          </span>
        </div>
        <button
          type="button"
          onClick={onNextMonth}
          className="inline-flex size-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-50 hover:text-brand-black transition-colors rtl:rotate-180"
          aria-label="Next month"
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50">
        {weekdayLabels.map((label, idx) => (
          <div
            key={idx}
            className="py-2 text-center text-[11px] font-medium text-gray-400 uppercase tracking-wide"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 flex-1">
        {cells.map((cell, idx) => {
          const isSelected = cell.iso === selectedDate;
          const isToday = cell.iso === today;
          const dayEvents = grouped[cell.iso] ?? [];
          const visibleEvents = dayEvents.slice(0, MAX_CHIPS);
          const overflow = dayEvents.length - MAX_CHIPS;

          const isLastRow = idx >= cells.length - 7;
          const colPos = idx % 7;
          const isLastCol = colPos === 6;

          return (
            <button
              key={cell.iso + (cell.inMonth ? "" : "-out")}
              type="button"
              onClick={() => onSelectDate(cell.iso)}
              className={cn(
                "group flex min-h-[90px] flex-col gap-1 p-1.5 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary/30",
                !isLastRow && "border-b border-gray-100",
                !isLastCol && "border-e border-gray-100",
                isSelected ? "bg-brand-primary/5" : "hover:bg-gray-50/60",
              )}
              aria-pressed={isSelected}
              aria-current={isToday ? "date" : undefined}
            >
              <span
                className={cn(
                  "ms-0.5 inline-flex size-6 items-center justify-center rounded-full text-xs font-medium tabular-nums",
                  !cell.inMonth && "text-gray-300",
                  cell.inMonth && !isSelected && !isToday && "text-gray-600",
                  isToday && !isSelected && "bg-brand-primary/10 text-brand-primary font-semibold",
                  isSelected && "bg-brand-primary text-white font-semibold",
                )}
              >
                {cell.day}
              </span>

              <div className="flex flex-col gap-0.5 w-full">
                {visibleEvents.map((ev) => (
                  <CalendarEventChip
                    key={ev.id}
                    title={ev.title}
                    type={ev.type}
                    isContinuation={cell.iso > localIsoDate(ev.startsAt)}
                  />
                ))}
                {overflow > 0 && (
                  <span className="block rounded px-1.5 py-0.5 text-[10px] font-medium text-gray-500 bg-gray-100">
                    +{overflow} {t("more")}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
