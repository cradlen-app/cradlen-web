"use client";

import type { Visit } from "../../../types/visits.types";
import { PatientSummaryCard } from "../overview/PatientSummaryCard";
import { VisitChartsPanel } from "../overview/VisitChartsPanel";
import { VisitContextRail } from "../overview/VisitContextRail";
import { VisitsHistoryList } from "../overview/VisitsHistoryList";

type Props = {
  visit: Visit;
};

export function OverviewTab({ visit }: Props) {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_minmax(0,1fr)]">
      <PatientSummaryCard
        patientId={visit.patient.id}
        fallbackFullName={visit.patient.fullName}
      />
      <div className="flex flex-col gap-6">
        <VisitsHistoryList />
        <VisitChartsPanel />
      </div>
      <VisitContextRail />
    </div>
  );
}
