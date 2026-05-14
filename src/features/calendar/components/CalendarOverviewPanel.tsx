"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Lock,
  Building2,
  Trash2,
  Loader2,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { cn } from "@/common/utils/utils";
import { useUserProfileContext } from "@/features/auth/hooks/useUserProfileContext";
import { formatEventTime, localIsoDate } from "../lib/calendar.utils";
import { TYPE_BAR_CLASS } from "./CalendarEventChip";
import { useDeleteCalendarEvent } from "../hooks/useDeleteCalendarEvent";
import type { CalendarEvent } from "../types/calendar.types";

type EntryProps = {
  event: CalendarEvent;
  canManage: boolean;
};

function OverviewEntry({ event, canManage }: EntryProps) {
  const t = useTranslations("calendar");
  const [expanded, setExpanded] = useState(false);

  const deleteMut = useDeleteCalendarEvent({
    onSuccess: () => toast.success(t("delete.success")),
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : t("delete.error")),
  });

  const hasDetails =
    !!event.description || !!event.procedureName || !!event.patientName;

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!window.confirm(t("delete.confirm"))) return;
    deleteMut.mutate(event.id);
  }

  return (
    <article className="relative overflow-hidden rounded-xl border border-gray-100 bg-white ps-4 pe-3 py-3">
      <span
        className={cn(
          "absolute inset-y-2 inset-s-1.5 w-1 rounded-full",
          TYPE_BAR_CLASS[event.type],
        )}
        aria-hidden="true"
      />

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
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
        </div>

        <div className="flex items-center gap-1">
          {canManage && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteMut.isPending}
              className="mt-0.5 shrink-0 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
              aria-label={t("delete.action")}
            >
              {deleteMut.isPending ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
              ) : (
                <Trash2 className="size-3.5" aria-hidden />
              )}
            </button>
          )}
          {hasDetails && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-0.5 shrink-0 text-gray-400 hover:text-brand-black transition-colors"
              aria-label={expanded ? "Collapse" : "Expand"}
            >
              {expanded ? (
                <ChevronUp className="size-3.5" aria-hidden />
              ) : (
                <ChevronDown className="size-3.5" aria-hidden />
              )}
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-2 space-y-1.5 border-t border-gray-100 pt-2">
          {event.procedureName && (
            <Detail label={t("form.procedure")} value={event.procedureName} />
          )}
          {event.patientName && (
            <Detail label={t("patientLabel")} value={event.patientName} />
          )}
          {event.description && (
            <Detail label={t("notes")} value={event.description} />
          )}
        </div>
      )}
    </article>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-[11px] text-gray-500">
      <span className="text-gray-400">{label}: </span>
      <span className="text-brand-black">{value}</span>
    </p>
  );
}

type Props = {
  events: CalendarEvent[];
  selectedDate: string;
};

export function CalendarOverviewPanel({ events, selectedDate }: Props) {
  const t = useTranslations("calendar");
  const locale = useLocale();
  const { currentUserStaffId } = useUserProfileContext();
  const ownerProfileId = currentUserStaffId;

  const dayEvents = events.filter(
    (e) => localIsoDate(e.startsAt) === selectedDate,
  );

  const selectedDateLabel = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(`${selectedDate}T12:00:00`));

  return (
    <aside
      aria-label={t("overview")}
      className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden"
    >
      <div className="border-b border-gray-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-brand-black">{t("overview")}</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">
          {selectedDateLabel}
        </h3>

        <div className="space-y-2.5">
          {dayEvents.length > 0 ? (
            dayEvents.map((event) => (
              <OverviewEntry
                key={event.id}
                event={event}
                canManage={event.profileId === ownerProfileId}
              />
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50/40 px-3 py-6 text-center text-xs text-gray-400">
              {t("empty")}
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
