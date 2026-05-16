"use client";

import { Clock } from "lucide-react";
import { useTranslations } from "next-intl";

export function VisitsHistoryList() {
  const t = useTranslations("visits.workspace.history");
  return (
    <section>
      <header className="flex items-center gap-2">
        <Clock className="size-4 text-brand-primary" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-brand-black">{t("title")}</h2>
      </header>
      <div className="mt-8 flex flex-col items-center gap-2 py-10 text-center">
        <p className="text-sm font-medium text-gray-500">{t("emptyTitle")}</p>
        <p className="max-w-xs text-xs text-gray-400">{t("emptyBody")}</p>
      </div>
    </section>
  );
}
