"use client";

import { LineChart } from "lucide-react";
import { useTranslations } from "next-intl";

export function VisitChartsPanel() {
  const t = useTranslations("visits.workspace.charts");
  return (
    <section>
      <header className="flex items-center gap-2">
        <LineChart className="size-4 text-brand-primary" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-brand-black">{t("title")}</h2>
      </header>
      <div className="mt-4">
        <h3 className="text-sm font-medium text-brand-primary">
          {t("bloodPressure.title")}
        </h3>
        <p className="mt-1 text-xs text-gray-500">
          {t("bloodPressure.lastReading")}{" "}
          <span className="font-medium text-gray-700">—</span>
        </p>
        <div className="mt-4 h-40 rounded-xl border border-dashed border-gray-200 bg-gray-50/40">
          <div className="flex h-full items-center justify-center">
            <p className="text-xs text-gray-400">{t("empty")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
