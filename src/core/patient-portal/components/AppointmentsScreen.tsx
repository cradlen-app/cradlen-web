"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";

import { formatDayMonth } from "../lib/format";
import { useAppointments } from "../hooks/usePortalData";
import type { Appointment } from "../types/patient-portal.types";
import {
  ClinicTag,
  EmptyState,
  ScreenHeader,
  SectionCard,
  StatusBadge,
  appointmentTone,
} from "./portal-ui";

export function AppointmentsScreen() {
  const t = useTranslations("patientPortal");
  const { data: appts, isLoading } = useAppointments();

  const upcoming = useMemo(
    () => (appts ?? []).filter((a) => a.status === "upcoming"),
    [appts],
  );
  const past = useMemo(
    () => (appts ?? []).filter((a) => a.status !== "upcoming"),
    [appts],
  );

  return (
    <div className="space-y-4">
      <ScreenHeader title={t("appointments.title")} />

      {isLoading ? (
        <EmptyState message={t("common.loading")} />
      ) : (appts?.length ?? 0) === 0 ? (
        <EmptyState message={t("appointments.none")} />
      ) : (
        <>
          <SectionCard title={t("appointments.upcoming")}>
            {upcoming.length === 0 ? (
              <p className="py-1 text-sm text-gray-400">
                {t("appointments.none")}
              </p>
            ) : (
              <ul className="space-y-2">
                {upcoming.map((a) => (
                  <ApptRow key={a.id} appt={a} />
                ))}
              </ul>
            )}
          </SectionCard>

          {past.length > 0 && (
            <SectionCard title={t("appointments.past")}>
              <ul className="space-y-2">
                {past.map((a) => (
                  <ApptRow key={a.id} appt={a} />
                ))}
              </ul>
            </SectionCard>
          )}
        </>
      )}

      <p className="px-1 text-center text-xs text-gray-400">
        {t("appointments.bookingNote")}
      </p>
    </div>
  );
}

function ApptRow({ appt }: { appt: Appointment }) {
  const t = useTranslations("patientPortal");
  const locale = useLocale();
  return (
    <li className="flex items-center gap-3 rounded-xl border border-gray-100 p-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-brand-black">
          {formatDayMonth(appt.date, locale)}
          {appt.time ? ` · ${appt.time}` : ""}
        </p>
        <p className="text-xs text-gray-500">
          {appt.doctorName} · {appt.type ?? appt.specialty}
        </p>
        <div className="mt-1">
          <ClinicTag clinic={appt.clinic} />
        </div>
      </div>
      <StatusBadge
        label={t(`status.${appt.status}` as Parameters<typeof t>[0])}
        tone={appointmentTone(appt.status)}
      />
    </li>
  );
}
