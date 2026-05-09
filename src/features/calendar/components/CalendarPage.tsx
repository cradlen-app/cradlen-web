"use client";

import { Suspense, useState } from "react";
import { useTranslations } from "next-intl";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { getActiveRole } from "@/features/auth/lib/current-user";
import { STAFF_ROLE } from "@/features/auth/lib/auth.constants";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { Button } from "@/components/ui/button";
import { CalendarGrid } from "./CalendarGrid";
import { CalendarOverviewPanel } from "./CalendarOverviewPanel";
import { NewEventDrawer } from "./NewEventDrawer";
import { useCalendarEvents } from "../hooks/useCalendarEvents";
import { monthWindowFrom, todayIso } from "../lib/calendar.utils";

function todayDate() {
  const t = todayIso(); // "YYYY-MM-DD"
  const [yyyy, mm] = t.split("-").map(Number);
  return { year: yyyy, month: mm - 1 };
}

type CalendarContentProps = {
  branchId: string | undefined;
  viewYear: number;
  viewMonth: number;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
};

function CalendarContent({
  branchId,
  viewYear,
  viewMonth,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
}: CalendarContentProps) {
  const { from, to } = monthWindowFrom(viewYear, viewMonth);
  const { data: events } = useCalendarEvents({ branchId, from, to });

  return (
    <>
      <section className="flex min-h-0 min-w-0 flex-col">
        <CalendarGrid
          events={events}
          selectedDate={selectedDate}
          viewYear={viewYear}
          viewMonth={viewMonth}
          onSelectDate={onSelectDate}
          onPrevMonth={onPrevMonth}
          onNextMonth={onNextMonth}
        />
      </section>
      <aside className="flex min-h-0 min-w-0 flex-col">
        <CalendarOverviewPanel events={events} selectedDate={selectedDate} />
      </aside>
    </>
  );
}

function CalendarContentSkeleton() {
  return (
    <>
      <div className="min-h-[500px] animate-pulse rounded-2xl bg-gray-100" />
      <div className="min-h-[300px] animate-pulse rounded-2xl bg-gray-100" />
    </>
  );
}

export function CalendarPage() {
  const t = useTranslations("calendar");
  const { data: user } = useCurrentUser();
  const role = getActiveRole(user);
  const branchId = useAuthContextStore((s) => s.branchId) ?? undefined;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerKey, setDrawerKey] = useState(0);
  const [selectedDate, setSelectedDate] = useState(todayIso);

  const initial = todayDate();
  const [viewYear, setViewYear] = useState(initial.year);
  const [viewMonth, setViewMonth] = useState(initial.month);

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

  function handleOpenDrawer() {
    setDrawerKey((k) => k + 1);
    setDrawerOpen(true);
  }

  const canCreate =
    role === STAFF_ROLE.OWNER || role === STAFF_ROLE.DOCTOR;

  return (
    <main className="flex h-full flex-col gap-6 overflow-hidden p-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-brand-black">
          {t("title")}
        </h1>
        {canCreate && (
          <Button onClick={handleOpenDrawer}>
            {t("newEvent")}
          </Button>
        )}
      </header>

      {/* Calendar grid + overview */}
      <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-1 gap-6 lg:grid-cols-[1fr_300px] lg:grid-rows-1">
        <Suspense fallback={<CalendarContentSkeleton />}>
          <CalendarContent
            branchId={branchId}
            viewYear={viewYear}
            viewMonth={viewMonth}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onPrevMonth={goPrev}
            onNextMonth={goNext}
          />
        </Suspense>
      </div>

      {/* New event drawer */}
      <NewEventDrawer
        key={drawerKey}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        defaultDate={selectedDate}
        branchId={branchId}
      />
    </main>
  );
}
