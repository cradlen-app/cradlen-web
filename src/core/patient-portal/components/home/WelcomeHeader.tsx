"use client";

import { useTranslations } from "next-intl";

import { useActiveProfile } from "../../hooks/usePatientProfiles";

/** Brand greeting hero: "Welcome {name}," + an evergreen health subline. */
export function WelcomeHeader() {
  const t = useTranslations("patientPortal");
  const profile = useActiveProfile();

  const firstName = profile?.fullName.split(" ")[0] ?? "";

  return (
    <div className="rounded-2xl bg-gradient-to-br from-brand-primary to-brand-primary/85 p-5 text-white shadow-sm">
      <h1 className="text-xl font-bold">
        {t("home.welcome", { name: firstName })}
      </h1>
      <p className="mt-0.5 text-sm text-white/80">{t("home.subtitle")}</p>
    </div>
  );
}
