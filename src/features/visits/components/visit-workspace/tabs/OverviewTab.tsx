"use client";

import type { Visit } from "../../../types/visits.types";
import { PatientOverview } from "../overview/PatientOverview";

type Props = {
  visit: Visit;
};

export function OverviewTab({ visit }: Props) {
  return (
    <PatientOverview
      patientId={visit.patient.id}
      specialtyCode={visit.specialtyCode ?? null}
      excludeVisitId={visit.id}
      patientDateOfBirth={visit.patient.dateOfBirth}
    />
  );
}
