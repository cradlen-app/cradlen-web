"use client";

import { useTranslations } from "next-intl";

interface Props {
  reason: "no_specialty" | "no_template";
  specialtyCode?: string | null;
}

export function PatientHistoryEmptyState({ reason, specialtyCode }: Props) {
  const t = useTranslations("patient_history.empty");
  const title = reason === "no_specialty" ? t("noSpecialtyTitle") : t("noTemplateTitle");
  const body =
    reason === "no_specialty"
      ? t("noSpecialtyBody")
      : t("noTemplateBody", { specialty: specialtyCode ?? "" });
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-12 text-center">
      <h3 className="text-sm font-medium text-gray-700">{title}</h3>
      <p className="max-w-md text-xs text-gray-500">{body}</p>
    </div>
  );
}