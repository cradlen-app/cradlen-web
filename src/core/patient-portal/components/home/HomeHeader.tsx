"use client";

import { useTranslations } from "next-intl";

import { useActiveProfile } from "../../hooks/usePatientProfiles";
import { PatientNotificationBell } from "../PatientNotificationBell";
import { ProfileAvatarGroup } from "./ProfileAvatarGroup";

/**
 * Home greeting row: "Hello, {full name}" with a care subline on the start side,
 * and the notification bell + stacked profile avatars on the end side.
 */
export function HomeHeader() {
  const t = useTranslations("patientPortal");
  const profile = useActiveProfile();
  const name = profile?.fullName ?? "";

  return (
    <header className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm text-gray-500">{t("home.hello")}</p>
        <h1 className="truncate text-2xl font-bold text-brand-black">{name}</h1>
        <p className="mt-1 text-sm text-gray-500">{t("home.careSubtitle")}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <div className="rounded-full bg-white shadow-sm">
          <PatientNotificationBell />
        </div>
        <ProfileAvatarGroup />
      </div>
    </header>
  );
}
