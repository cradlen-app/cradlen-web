"use client";

import type { Visit } from "../../../types/visits.types";
import { PatientSummaryCard } from "../overview/PatientSummaryCard";
import { VisitChartsPanel } from "../overview/VisitChartsPanel";
import { VisitsHistoryList } from "../overview/VisitsHistoryList";

type Props = {
  visit: Visit;
};

export function OverviewTab({ visit }: Props) {
  return (
    <section className="h-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="grid h-full grid-cols-1 md:grid-cols-[240px_minmax(0,1fr)] md:divide-x md:divide-gray-100 rtl:md:divide-x-reverse">
        <PatientSummaryCard
          patientId={visit.patient.id}
          fallbackFullName={visit.patient.fullName}
        />
        <div className="flex h-full flex-col gap-6 divide-y divide-gray-100 overflow-y-auto p-5">
          <VisitsHistoryList />
          <div className="pt-6">
            <VisitChartsPanel />
          </div>
        </div>
      </div>
    </section>
  );
}
