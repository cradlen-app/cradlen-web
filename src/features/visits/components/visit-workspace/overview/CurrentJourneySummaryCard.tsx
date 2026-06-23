"use client";

import { Activity } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActiveJourneySummary } from "@/features/journeys/lib/useActiveJourneySummary";
import type {
  ActiveJourneySummary,
  JourneySummaryFlag,
  SummarySignalSeverity,
} from "@/features/journeys/lib/active-journey-summary.api";
import { PregnancyTimeline } from "./PregnancyTimeline";

type Props = { patientId: string };

const FLAG_STYLES: Record<SummarySignalSeverity, string> = {
  high: "bg-red-50 text-red-700 border border-red-100",
  medium: "bg-amber-50 text-amber-700 border border-amber-100",
  low: "bg-gray-100 text-gray-600",
  positive: "bg-green-50 text-green-700 border border-green-100",
};

function FlagChip({ flag }: { flag: JourneySummaryFlag }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${FLAG_STYLES[flag.severity]}`}
    >
      {flag.label}
    </span>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1.5 text-xs">
      <span className="shrink-0 font-medium text-gray-500">{label}:</span>
      <span className="text-gray-700">{value}</span>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="mt-3 space-y-2">
      {[80, 60, 70].map((w, i) => (
        <div
          key={i}
          className="h-3 animate-pulse rounded bg-gray-100"
          style={{ width: `${w}%` }}
        />
      ))}
    </div>
  );
}

export function CurrentJourneySummaryCard({ patientId }: Props) {
  const t = useTranslations("visits.workspace.currentJourney");
  const { data, isLoading, isError } = useActiveJourneySummary(patientId);

  // Nothing to show when the patient has no journey at all — keep Overview clean.
  if (!isLoading && (isError || !data || !data.journey_exists)) return null;

  return (
    <section>
      <header className="flex items-center gap-2">
        <Activity className="size-4 text-brand-primary" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-brand-black">{t("title")}</h2>
      </header>
      {!isLoading && data?.identifier && (
        <div className="mt-4">
          <PregnancyTimeline patientId={patientId} />
        </div>
      )}
      {isLoading || !data ? <Skeleton /> : <SummaryView data={data} t={t} />}
    </section>
  );
}

function SummaryView({
  data,
  t,
}: {
  data: ActiveJourneySummary;
  t: ReturnType<typeof useTranslations>;
}) {
  const headerParts = [
    data.care_path_label,
    data.is_active ? t("statusActive") : t("statusEnded"),
    data.current_episode?.name,
  ].filter(Boolean);

  return (
    <div className="my-4 space-y-3">
      <p className="text-sm font-semibold text-brand-primary">
        {headerParts.join(" • ") || "—"}
      </p>

      {data.flags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {data.flags.map((flag, i) => (
            <FlagChip key={i} flag={flag} />
          ))}
        </div>
      )}

      {data.identifier ? (
        <div className="space-y-1">
          {data.identifier.ga && (
            <Row
              label={t("ga")}
              value={`${data.identifier.ga}${data.identifier.ga_source ? ` (${data.identifier.ga_source})` : ""}`}
            />
          )}
          {data.identifier.edd && (
            <Row label={t("edd")} value={data.identifier.edd} />
          )}
          {data.identifier.risk_level && (
            <Row label={t("risk")} value={data.identifier.risk_level} />
          )}
          {data.identifier.number_of_fetuses != null && (
            <Row
              label={t("fetuses")}
              value={String(data.identifier.number_of_fetuses)}
            />
          )}
          {data.identifier.blood_group_rh && (
            <Row label={t("bloodGroup")} value={data.identifier.blood_group_rh} />
          )}
        </div>
      ) : data.encounter ? (
        <div className="space-y-1">
          {data.encounter.chief_complaint && (
            <Row label={t("complaint")} value={data.encounter.chief_complaint} />
          )}
          {data.encounter.provisional_diagnosis && (
            <Row
              label={t("provisional")}
              value={data.encounter.provisional_diagnosis}
            />
          )}
        </div>
      ) : null}

      {data.outcome?.outcome_type ? (
        <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-600">
          {t("outcome")}: {String(data.outcome.outcome_type)}
        </span>
      ) : null}
    </div>
  );
}
