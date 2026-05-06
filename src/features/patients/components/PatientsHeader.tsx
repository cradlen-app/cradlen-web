import { useTranslations } from "next-intl";

export function PatientsHeader() {
  const t = useTranslations("patients");

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-medium text-brand-black">{t("title")}</h1>
    </div>
  );
}
