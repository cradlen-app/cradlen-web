"use client";

import { LineChart } from "lucide-react";
import { useTranslations } from "next-intl";

const MOCK_LATEST_BP = { systolic: 150, diastolic: 95 };

export function VisitChartsPanel() {
  const t = useTranslations("visits.workspace.charts");

  return (
    <section>
      <header className="flex items-center gap-2">
        <LineChart className="size-4 text-brand-primary" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-brand-black">{t("title")}</h2>
      </header>

      <div className="mt-4 space-y-2">
        <h3 className="text-sm font-medium text-brand-primary">
          {t("bloodPressure.title")}
        </h3>

        <p className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-gray-700">
          <span>
            {t("bloodPressure.lastReading")}{" "}
            <span className="font-medium tabular-nums">
              {t("bp")}: {MOCK_LATEST_BP.systolic} / {MOCK_LATEST_BP.diastolic}
            </span>
          </span>
          <span>
            {t("status")} :{" "}
            <span className="font-semibold text-red-600">{t("statusHigh")}</span>
          </span>
        </p>

        <p className="text-xs text-gray-500">{t("unit", { unit: "mmHg" })}</p>
      </div>

      <div className="mt-4 flex">
        <span
          className="w-8 pt-1 text-[10px] tabular-nums text-gray-400"
          aria-hidden="true"
        >
          200
        </span>
        <div className="relative flex-1 h-40">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="absolute inset-x-0 border-t border-dashed border-gray-200"
              style={{ top: `${i * 25}%` }}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
