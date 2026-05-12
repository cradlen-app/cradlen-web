"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/common/utils/utils";

type Props = {
  selectedDate: string; // YYYY-MM-DD
  onSelect: (date: string) => void;
  bare?: boolean;
};

function toIsoDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function fromIsoDate(iso: string) {
  const [yyyy, mm, dd] = iso.split("-").map(Number);
  return new Date(yyyy, mm - 1, dd);
}

function buildMonthGrid(year: number, month: number, weekStartsOn: 0 | 6) {
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const firstDayOfWeek = firstOfMonth.getDay(); // 0=Sun..6=Sat
  const offsetFromStart = (firstDayOfWeek - weekStartsOn + 7) % 7;

  const cells: Array<{ day: number; iso: string; inMonth: boolean }> = [];

  // Leading days from previous month
  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = offsetFromStart - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const date = new Date(year, month - 1, day);
    cells.push({
      day,
      iso: toIsoDate(date.getFullYear(), date.getMonth(), date.getDate()),
      inMonth: false,
    });
  }
  // Days in month
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ day, iso: toIsoDate(year, month, day), inMonth: true });
  }
  // Trailing — fill to multiple of 7
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1];
    const next = fromIsoDate(last.iso);
    next.setDate(next.getDate() + 1);
    cells.push({
      day: next.getDate(),
      iso: toIsoDate(next.getFullYear(), next.getMonth(), next.getDate()),
      inMonth: false,
    });
  }
  return cells;
}

export function MiniCalendar({ selectedDate, onSelect, bare }: Props) {
  const locale = useLocale();
  const t = useTranslations("dashboardHome.calendar");
  const weekStartsOn: 0 | 6 = locale === "ar" ? 6 : 0;

  const initial = fromIsoDate(selectedDate);
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const cells = useMemo(
    () => buildMonthGrid(viewYear, viewMonth, weekStartsOn),
    [viewYear, viewMonth, weekStartsOn],
  );

  const monthLabel = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, {
      month: "long",
      year: "numeric",
    });
    return formatter.format(new Date(viewYear, viewMonth, 1));
  }, [locale, viewYear, viewMonth]);

  const weekdayLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { weekday: "narrow" });
    const labels: string[] = [];
    const reference = new Date(2024, 0, 7); // a Sunday
    for (let i = 0; i < 7; i++) {
      const d = new Date(reference);
      d.setDate(reference.getDate() + ((weekStartsOn + i) % 7));
      labels.push(formatter.format(d));
    }
    return labels;
  }, [locale, weekStartsOn]);

  const todayIso = toIsoDate(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate(),
  );

  function goPrev() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }
  function goNext() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  const inner = (
    <>
      <header className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={goPrev}
          className="inline-flex size-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-50 hover:text-brand-black rtl:rotate-180"
          aria-label="Previous month"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
        <span className="text-sm font-semibold text-brand-black">{monthLabel}</span>
        <button
          type="button"
          onClick={goNext}
          className="inline-flex size-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-50 hover:text-brand-black rtl:rotate-180"
          aria-label="Next month"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </header>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-gray-400">
        {weekdayLabels.map((label, idx) => (
          <span key={idx}>{label}</span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((cell) => {
          const isSelected = cell.iso === selectedDate;
          const isToday = cell.iso === todayIso;
          return (
            <button
              key={cell.iso + (cell.inMonth ? "" : "-out")}
              type="button"
              onClick={() => onSelect(cell.iso)}
              className={cn(
                "aspect-square rounded-md text-xs transition-colors tabular-nums",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30",
                !cell.inMonth && "text-gray-300",
                cell.inMonth && !isSelected && "text-gray-600 hover:bg-gray-50",
                isSelected &&
                  "bg-brand-primary text-white font-semibold hover:bg-brand-primary/90",
                isToday && !isSelected && "ring-1 ring-brand-primary/40 text-brand-primary",
              )}
              aria-pressed={isSelected}
              aria-current={isToday ? "date" : undefined}
            >
              {cell.day}
            </button>
          );
        })}
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
