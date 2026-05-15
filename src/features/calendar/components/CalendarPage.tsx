"use client";

import { Suspense, useEffect, useState } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Dialog } from "radix-ui";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { getActiveProfile } from "@/features/auth/lib/current-user";
import {
  isBranchManager,
  isClinical,
  isOwner,
} from "@/features/auth/lib/permissions";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/useMediaQuery";
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
  mobileOverviewOpen: boolean;
  onMobileOverviewChange: (open: boolean) => void;
  footerHeight: number;
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
  mobileOverviewOpen,
  onMobileOverviewChange,
  footerHeight,
}: CalendarContentProps) {
  const t = useTranslations("calendar");
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
      <aside className="hidden min-h-0 min-w-0 flex-col lg:flex">
        <CalendarOverviewPanel
          events={events}
          selectedDate={selectedDate}
          onEditEvent={onEditEvent}
        />
      </aside>

      <Dialog.Root open={mobileOverviewOpen} onOpenChange={onMobileOverviewChange}>
        <Dialog.Portal>
          <Dialog.Overlay
            style={{ top: "4rem", bottom: footerHeight }}
            className="fixed inset-x-0 z-50 bg-black/40 lg:hidden"
          />
          <Dialog.Content
            aria-describedby={undefined}
            style={{ top: "4rem", bottom: footerHeight }}
            className="fixed inset-x-0 z-50 flex flex-col bg-white outline-none lg:hidden"
          >
            <Dialog.Title className="sr-only">{t("overview")}</Dialog.Title>
            <Dialog.Close
              aria-label={t("close")}
              className="absolute inset-e-3 top-3 z-10 inline-flex size-8 items-center justify-center rounded-full bg-white/90 text-gray-500 shadow-sm transition-colors hover:bg-gray-100 hover:text-brand-black"
            >
              <X className="size-4" aria-hidden="true" />
            </Dialog.Close>
            <div className="flex-1 overflow-y-auto">
              <CalendarOverviewPanel
                events={events}
                selectedDate={selectedDate}
                onEditEvent={(ev) => {
                  onMobileOverviewChange(false);
                  onEditEvent(ev);
                }}
              />
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
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

  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [mobileOverviewOpen, setMobileOverviewOpen] = useState(false);

  const [footerHeight, setFooterHeight] = useState(0);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const footer = document.querySelector("footer");
    if (!footer) return;
    const update = () =>
      setFooterHeight(footer.getBoundingClientRect().height);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(footer);
    return () => ro.disconnect();
  }, []);

  function handleSelectDate(date: string) {
    setSelectedDate(date);
    if (!isDesktop) setMobileOverviewOpen(true);
  }

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
            onSelectDate={handleSelectDate}
            onPrevMonth={goPrev}
            onNextMonth={goNext}
            onEditEvent={handleOpenEdit}
            mobileOverviewOpen={mobileOverviewOpen}
            onMobileOverviewChange={setMobileOverviewOpen}
            footerHeight={footerHeight}
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
