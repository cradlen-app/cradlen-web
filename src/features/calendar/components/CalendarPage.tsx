"use client";

import { Suspense, useState } from "react";
import { useTranslations } from "next-intl";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { getActiveProfile } from "@/features/auth/lib/current-user";
import {
  isBranchManager,
  isClinical,
  isOwner,
} from "@/features/auth/lib/permissions";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { Button } from "@/components/ui/button";
import { CalendarGrid } from "./CalendarGrid";
import { CalendarOverviewPanel } from "./CalendarOverviewPanel";
import { NewEventDrawer } from "./NewEventDrawer";
import { useCalendarEvents } from "../hooks/useCalendarEvents";
import { monthWindowFrom, todayIso } from "../lib/calendar.utils";
import type { CalendarEvent } from "../types/calendar.types";

function todayDate() {
  const t = todayIso();
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
  onEditEvent: (event: CalendarEvent) => void;
};

function CalendarContent({
  branchId,
  viewYear,
  viewMonth,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  onEditEvent,
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
        <CalendarOverviewPanel
          events={events}
          selectedDate={selectedDate}
          onEditEvent={onEditEvent}
        />
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
  const profile = getActiveProfile(user);
  const branchId = useAuthContextStore((s) => s.branchId) ?? undefined;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerKey, setDrawerKey] = useState(0);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
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

  function handleOpenCreate() {
    setEditingEvent(null);
    setDrawerKey((k) => k + 1);
    setDrawerOpen(true);
  }

  function handleOpenEdit(event: CalendarEvent) {
    setEditingEvent(event);
    setDrawerKey((k) => k + 1);
    setDrawerOpen(true);
  }

  function handleDrawerChange(open: boolean) {
    setDrawerOpen(open);
    if (!open) setEditingEvent(null);
  }

  const canCreate =
    isOwner(profile) || isBranchManager(profile) || isClinical(profile);

  return (
    <main className="flex h-full flex-col gap-6 overflow-hidden p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-brand-black">{t("title")}</h1>
        {canCreate && (
          <Button onClick={handleOpenCreate}>{t("newEvent")}</Button>
        )}
      </header>

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
            onEditEvent={handleOpenEdit}
          />
        </Suspense>
      </div>

      <NewEventDrawer
        key={drawerKey}
        open={drawerOpen}
        onOpenChange={handleDrawerChange}
        defaultDate={selectedDate}
        branchId={branchId}
        event={editingEvent}
      />
    </main>
  );
}
