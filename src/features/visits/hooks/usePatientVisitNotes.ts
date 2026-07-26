"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { fetchPatientVisitNotes } from "../lib/visit-notes.api";

type Params = {
  patientId: string;
  page?: number;
  limit?: number;
};

/** The caller's own notes across every visit of one patient, newest visit first. */
export function usePatientVisitNotes({
  patientId,
  page = 1,
  limit = 50,
}: Params) {
  return useQuery({
    queryKey: queryKeys.visitNotes.forPatient(patientId, { page, limit }),
    queryFn: () => fetchPatientVisitNotes({ patientId, page, limit }),
    enabled: !!patientId,
  });
}
