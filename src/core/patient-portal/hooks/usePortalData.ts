"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import {
  fetchAppointments,
  fetchDocuments,
  fetchHealthRecord,
  fetchLabOrders,
  fetchMedications,
  fetchReminders,
  fetchVisitHistory,
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
 * Paginated visit history for the active profile (newest first), as an infinite
 * query — mirrors the staff `usePatientVisitHistory`. Returns flattened
 * `entries` plus load-more controls for the timeline.
 */
export function useVisitHistory() {
  const patientId = useActivePatientId();
  const query = useInfiniteQuery({
    queryKey: patientPortalQueryKeys.visitHistory(patientId),
    queryFn: ({ pageParam }) =>
      fetchVisitHistory({ patientId, page: pageParam, limit: 10 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.flatMap((p) => p.data).length;
      return loaded < lastPage.meta.total ? allPages.length + 1 : undefined;
    },
  });

  const entries = query.data?.pages.flatMap((p) => p.data) ?? [];

  return {
    entries,
    isLoading: query.isLoading,
    isLoadingMore: query.isFetchingNextPage,
    hasMore: query.hasNextPage,
    loadMore: query.fetchNextPage,
  };
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
