"use client";

import { useMemo } from "react";
import { Video } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { cn } from "@/common/utils/utils";
import { Link } from "@/i18n/navigation";
import { formatDate } from "../../lib/format";
import { useAppointments } from "../../hooks/usePortalData";
import type { Appointment } from "../../types/patient-portal.types";
import { EmptyState, SectionCard } from "../portal-ui";

function initials(name: string): string {
  return name
    .replace(/^Dr\.?\s*/i, "")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function UpcomingAppointments() {
  const t = useTranslations("patientPortal");
  const locale = useLocale();
  const { data: appointments, isLoading } = useAppointments();

  const upcoming = useMemo(
    () =>
      (appointments ?? [])
        .filter((a) => a.status === "upcoming")
        .sort((a, b) => a.date.localeCompare(b.date)),
    [appointments],
  );

  return (
    <SectionCard
      title={t("home.upcomingAppointments")}
      action={
        <Link
          href="/patient/appointments"
          className="text-xs font-semibold text-brand-primary"
        >
          {t("home.viewAll")} ›
        </Link>
      }
    >
      {isLoading ? (
        <EmptyState message={t("common.loading")} />
      ) : upcoming.length === 0 ? (
        <EmptyState message={t("appointments.none")} />
      ) : (
        <ul className="divide-y divide-gray-100">
          {upcoming.map((a, i) => (
            <AppointmentRow
              key={a.id}
              appt={a}
              locale={locale}
              primary={i === 0}
            />
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

function AppointmentRow({
  appt,
  locale,
  primary,
}: {
  appt: Appointment;
  locale: string;
  primary: boolean;
}) {
  const t = useTranslations("patientPortal");
  const soon = () => toast(t("home.comingSoon"));

  return (
    <li className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-brand-black">
          {appt.type ?? appt.specialty}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="flex size-5 items-center justify-center rounded-full bg-brand-secondary/25 text-[9px] font-bold text-brand-primary">
              {initials(appt.doctorName)}
            </span>
            {appt.doctorName}
          </span>
          <span>·</span>
          <span>{formatDate(appt.date, locale)}</span>
          {appt.time && (
            <>
              <span>·</span>
              <span>{appt.time}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {primary ? (
          <button
            type="button"
            onClick={soon}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-primary px-3 py-2 text-xs font-bold text-white"
          >
            <Video className="size-3.5" />
            {t("home.joinSession")}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={soon}
              className={cn(
                "rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50",
              )}
            >
              {t("home.cancelAppointment")}
            </button>
            <button
              type="button"
              onClick={soon}
              className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
            >
              {t("home.reschedule")}
            </button>
          </>
        )}
      </div>
    </li>
  );
}
