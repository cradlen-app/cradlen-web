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

export function useMedications() {
  const patientId = useActivePatientId();
  return useQuery({
    queryKey: patientPortalQueryKeys.medications(patientId),
    queryFn: () => fetchMedications(patientId),
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
