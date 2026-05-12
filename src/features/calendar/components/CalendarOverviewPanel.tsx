"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/common/utils/utils";
import { useUserProfileContext } from "@/features/auth/hooks/useUserProfileContext";
import { useStaff } from "@/core/staff/api";
import { formatEventTime, localIsoDate } from "../lib/calendar.utils";
import { TYPE_BAR_CLASS } from "./CalendarEventChip";
import type { CalendarEvent, CalendarParticipant } from "../types/calendar.types";

function useStaffNameMap() {
  const { organizationId } = useUserProfileContext();
  const { data: staff = [] } = useStaff(organizationId, undefined);
  const map = new Map<string, string>();
  for (const s of staff) {
    const name = `${s.firstName} ${s.lastName}`.trim() || (s.email ?? s.id);
    map.set(s.id, name);
  }
  return map;
}

function resolveName(p: CalendarParticipant, nameMap: Map<string, string>): string {
  return p.name ?? nameMap.get(p.profileId) ?? p.profileId;
}

type EntryProps = {
  event: CalendarEvent;
  nameMap: Map<string, string>;
};

function OverviewEntry({ event, nameMap }: EntryProps) {
  const t = useTranslations("calendar");
  const [expanded, setExpanded] = useState(false);

  const surgeryDetails = event.type === "SURGERY"
    ? (event.details as { surgery_name?: string; operating_room?: string; pre_op_notes?: string })
    : null;
  const meetingDetails = event.type === "MEETING"
    ? (event.details as { location?: string; virtual_link?: string; agenda?: string })
    : null;
  const leaveDetails = event.type === "LEAVE"
    ? (event.details as { reason?: string })
    : null;

  const primaryDoctor = event.participants.find((p) => p.role === "PRIMARY_DOCTOR");
  const assistants = event.participants.filter((p) => p.role === "ASSISTANT");
  const attendees = event.participants.filter((p) => p.role === "ATTENDEE");

  const hasDetails =
    event.description ||
    event.patientName ||
    surgeryDetails?.surgery_name ||
    surgeryDetails?.operating_room ||
    surgeryDetails?.pre_op_notes ||
    meetingDetails?.location ||
    meetingDetails?.virtual_link ||
    meetingDetails?.agenda ||
    leaveDetails?.reason ||
    primaryDoctor ||
    assistants.length > 0 ||
    attendees.length > 0;

  return (
    <article
      className="relative overflow-hidden rounded-xl border border-gray-100 bg-white ps-4 pe-3 py-3"
    >
      <span
        className={cn(
          "absolute inset-y-2 inset-s-1.5 w-1 rounded-full",
          TYPE_BAR_CLASS[event.type],
        )}
        aria-hidden="true"
      />

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-brand-black">
            {event.title}
          </p>
          {event.type === "SURGERY" && surgeryDetails?.surgery_name && (
            <p className="mt-0.5 truncate text-[11px] text-gray-500">
              {surgeryDetails.surgery_name}
            </p>
          )}
          <p className="mt-0.5 text-[11px] tabular-nums text-gray-500">
            {event.allDay ? t("allDay") : formatEventTime(event.startsAt, event.endsAt)}
          </p>
        </div>

        {hasDetails && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-0.5 shrink-0 text-gray-400 hover:text-brand-black transition-colors"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded
              ? <ChevronUp className="size-3.5" aria-hidden />
              : <ChevronDown className="size-3.5" aria-hidden />}
          </button>
        )}
      </div>

      {expanded && (
        <div className="mt-2 space-y-1.5 border-t border-gray-100 pt-2">
          {/* Patient */}
          {event.patientName && (
            <Detail label={t("patientLabel")} value={event.patientName} />
          )}

          {/* Primary doctor */}
          {primaryDoctor && (
            <Detail label={t("primaryDoctor")} value={resolveName(primaryDoctor, nameMap)} />
          )}

          {/* Assistants */}
          {assistants.length > 0 && (
            <Detail
              label={t("assistants")}
              value={assistants.map((a) => resolveName(a, nameMap)).join(", ")}
            />
          )}

          {/* Attendees */}
          {attendees.length > 0 && (
            <Detail
              label={t("attendees")}
              value={attendees.map((a) => resolveName(a, nameMap)).join(", ")}
            />
          )}

          {/* Surgery details */}
          {surgeryDetails?.operating_room && (
            <Detail label={t("form.operatingRoom")} value={surgeryDetails.operating_room} />
          )}
          {surgeryDetails?.pre_op_notes && (
            <Detail label={t("form.preOpNotes")} value={surgeryDetails.pre_op_notes} />
          )}

          {/* Meeting details */}
          {meetingDetails?.location && (
            <Detail label={t("form.location")} value={meetingDetails.location} />
          )}
          {meetingDetails?.agenda && (
            <Detail label={t("form.agenda")} value={meetingDetails.agenda} />
          )}
          {meetingDetails?.virtual_link && (
            <p className="text-[11px] text-gray-500">
              <a
                href={meetingDetails.virtual_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-primary underline underline-offset-2"
              >
                {t("form.virtualLink")}
              </a>
            </p>
          )}

          {/* Leave reason */}
          {leaveDetails?.reason && (
            <Detail label={t("form.reason")} value={leaveDetails.reason} />
          )}

          {/* Notes / description */}
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
  const nameMap = useStaffNameMap();

  const dayEvents = events.filter((e) => localIsoDate(e.startsAt) === selectedDate);

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
              <OverviewEntry key={event.id} event={event} nameMap={nameMap} />
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
