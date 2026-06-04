"use client";

import { useQuery } from "@tanstack/react-query";

import {
  fetchAppointments,
  fetchDocuments,
  fetchHealthRecord,
  fetchLabOrders,
  fetchMedications,
  fetchReminders,
} from "../data/patient-portal.api";
import { patientPortalQueryKeys } from "../queryKeys";
import { useActivePatientId } from "./usePatientProfiles";

/**
 * Read hooks for the active patient profile. Each is keyed by the active
 * profile id so switching profiles fetches/caches independently.
 */

export function useHealthRecord() {
  const patientId = useActivePatientId();
  return useQuery({
    queryKey: patientPortalQueryKeys.healthRecord(patientId),
    queryFn: () => fetchHealthRecord(patientId),
  });
}

/**
 * Minimal read of the patient identity (`patient_id`, `accessible_patient_ids`)
 * the `PatientNavbar` already loads via `usePatientMe()`. Subscribes to the same
 * query cache entry (`enabled: false`, no queryFn) so core never imports
 * `features/auth`.
 */
type PatientIdentityRead = {
  patient_id: string | null;
  accessible_patient_ids: string[];
};

function usePatientIdentity() {
  return useQuery<PatientIdentityRead>({
    queryKey: patientPortalQueryKeys.me(),
    enabled: false,
  });
}

/**
 * Live medications for the patient currently in view, scoped by the real
 * backend patient id. Resolves the id from the authenticated identity (not the
 * fixture profile store, so the other prototype screens are untouched): the
 * active profile id when it is a real accessible id, otherwise the account
 * holder (`patient_id`) or the first accessible patient.
 */
export function useMedications() {
  const { data: identity } = usePatientIdentity();
  const activeFixtureId = useActivePatientId();

  const accessible = identity?.accessible_patient_ids ?? [];
  const patientId = accessible.includes(activeFixtureId)
    ? activeFixtureId
    : (identity?.patient_id ?? accessible[0]);

  return useQuery({
    queryKey: patientPortalQueryKeys.medications(patientId ?? "none"),
    queryFn: () => fetchMedications(patientId as string),
    enabled: Boolean(patientId),
  });
}

export function useLabOrders() {
  const patientId = useActivePatientId();
  return useQuery({
    queryKey: patientPortalQueryKeys.labOrders(patientId),
    queryFn: () => fetchLabOrders(patientId),
  });
}

export function useDocuments() {
  const patientId = useActivePatientId();
  return useQuery({
    queryKey: patientPortalQueryKeys.documents(patientId),
    queryFn: () => fetchDocuments(patientId),
  });
}

export function useAppointments() {
  const patientId = useActivePatientId();
  return useQuery({
    queryKey: patientPortalQueryKeys.appointments(patientId),
    queryFn: () => fetchAppointments(patientId),
  });
}

export function useReminders() {
  const patientId = useActivePatientId();
  return useQuery({
    queryKey: [...patientPortalQueryKeys.home(patientId), "reminders"],
    queryFn: () => fetchReminders(patientId),
  });
}
