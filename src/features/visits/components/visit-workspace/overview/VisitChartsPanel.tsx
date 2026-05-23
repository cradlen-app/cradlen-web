"use client";

import { LineChart } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePatientVitalsTrend } from "../../../hooks/usePatientVitalsTrend";
import { BpTrendChart } from "./BpTrendChart";
import { BmiTrendChart } from "./BmiTrendChart";

type Props = {
  patientId: string;
  excludeVisitId: string;
};

export function VisitChartsPanel({ patientId, excludeVisitId }: Props) {
  const t = useTranslations("visits.workspace.charts");
  const { points, isLoading, isError } = usePatientVitalsTrend({
    patientId,
    excludeVisitId,
  });

  return (
    <section>
      <header className="flex items-center gap-2">
        <LineChart className="size-4 text-brand-primary" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-brand-black">{t("title")}</h2>
      </header>

      {isLoading && (
        <p className="mt-4 text-xs text-gray-400">{t("loading")}</p>
      )}

      {!isLoading && isError && (
        <p className="mt-4 text-xs text-red-400">{t("error")}</p>
      )}

      {!isLoading && !isError && (
        <div className="mt-4 space-y-6">
          <div>
            <h3 className="mb-2 text-sm font-medium text-brand-primary">
              {t("bp.title")}
            </h3>
            <BpTrendChart points={points} emptyLabel={t("bp.empty")} />
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium text-brand-primary">
              {t("bmi.title")}
            </h3>
            <BmiTrendChart points={points} emptyLabel={t("bmi.empty")} />
          </div>
        </div>
      )}
    </section>
  );
}
