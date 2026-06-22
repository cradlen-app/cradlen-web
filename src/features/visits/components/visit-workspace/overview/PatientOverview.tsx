"use client";

import { PatientSummaryCard } from "./PatientSummaryCard";
import { VisitChartsPanel } from "./VisitChartsPanel";
import { VisitsHistoryList } from "./VisitsHistoryList";
import { ObgynHistorySummaryCard } from "./ObgynHistorySummaryCard";
import { CurrentJourneySummaryCard } from "./CurrentJourneySummaryCard";

type Props = {
  patientId: string;
  specialtyCode?: string | null;
  /** Visit id to exclude from the visits-history timeline; "" shows all. */
  excludeVisitId: string;
  patientDateOfBirth?: string;
  fallbackFullName?: string;
};

/**
 * Patient-scoped overview: summary card + (OB/GYN) history summary + visits
 * history + (OB/GYN) vitals charts. Shared by the visit workspace Overview tab
 * and the standalone patient workspace page.
 */
export function PatientOverview({
  patientId,
  specialtyCode,
  excludeVisitId,
  patientDateOfBirth,
  fallbackFullName,
}: Props) {
  const isObgyn = specialtyCode === "OBGYN";

  return (
    <section className="h-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="grid h-full grid-cols-1 md:grid-cols-[320px_minmax(0,1fr)] md:divide-x md:divide-gray-100 rtl:md:divide-x-reverse">
        <PatientSummaryCard
          patientId={patientId}
          fallbackFullName={fallbackFullName}
        />
        <div className="flex h-full flex-col gap-6 divide-y divide-gray-100 overflow-y-auto p-5">
          {isObgyn && (
            <ObgynHistorySummaryCard
              patientId={patientId}
              patientDateOfBirth={patientDateOfBirth}
            />
          )}
          {isObgyn && <CurrentJourneySummaryCard patientId={patientId} />}
          <VisitsHistoryList
            patientId={patientId}
            excludeVisitId={excludeVisitId}
          />
          {isObgyn && (
            <div>
              <VisitChartsPanel
                patientId={patientId}
                excludeVisitId={excludeVisitId}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
