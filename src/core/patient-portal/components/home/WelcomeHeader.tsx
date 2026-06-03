"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

import { useActiveProfile } from "../../hooks/usePatientProfiles";
import { useAppointments } from "../../hooks/usePortalData";

/** "Welcome {name}," + a summary of today's appointments. */
export function WelcomeHeader() {
  const t = useTranslations("patientPortal");
  const profile = useActiveProfile();
  const { data: appointments } = useAppointments();

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayCount = useMemo(
    () =>
      (appointments ?? []).filter(
        (a) => a.status === "upcoming" && a.date === todayStr,
      ).length,
    [appointments, todayStr],
  );

  const firstName = profile?.fullName.split(" ")[0] ?? "";

  return (
    <div>
      <h1 className="text-xl font-bold text-brand-black">
        {t("home.welcome", { name: firstName })}
      </h1>
      <p className="mt-0.5 text-sm text-gray-500">
        {todayCount === 0
          ? t("home.todayNone")
          : t("home.todayCount", { count: todayCount })}
      </p>
    </div>
  );
}
