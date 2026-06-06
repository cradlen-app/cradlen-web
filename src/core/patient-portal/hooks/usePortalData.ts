"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import {
  fetchAppointments,
  fetchDocuments,
  fetchHealthRecord,
  fetchLabOrders,
  fetchInvestigations,
  fetchMedications,
  fetchObgynHistory,
  fetchReminders,
  fetchUpcomingVisits,
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
 * Paginated visit history for the patient currently in view (newest first), as
 * an infinite query against the live endpoint. Scoped by the real backend
 * patient id (see `useResolvedPatientId`) and gated until that id resolves, so
 * the request never targets a stale fixture id.
 */
export function useVisitHistory() {
  const patientId = useResolvedPatientId();
  const query = useInfiniteQuery({
    queryKey: patientPortalQueryKeys.visitHistory(patientId ?? "none"),
    queryFn: ({ pageParam }) =>
      fetchVisitHistory({
        patientId: patientId as string,
        page: pageParam,
        limit: 10,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.flatMap((p) => p.data).length;
      return loaded < lastPage.meta.total ? allPages.length + 1 : undefined;
    },
    enabled: Boolean(patientId),
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
 * Paginated upcoming recommended follow-ups for the patient currently in view
 * (soonest first), as an infinite query against the live endpoint. Scoped by
 * the real backend patient id (see `useResolvedPatientId`) and gated until that
 * id resolves, mirroring `useVisitHistory`.
 */
export function useUpcomingVisits() {
  const patientId = useResolvedPatientId();
  const query = useInfiniteQuery({
    queryKey: patientPortalQueryKeys.upcomingVisits(patientId ?? "none"),
    queryFn: ({ pageParam }) =>
      fetchUpcomingVisits({
        patientId: patientId as string,
        page: pageParam,
        limit: 10,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.flatMap((p) => p.data).length;
      return loaded < lastPage.meta.total ? allPages.length + 1 : undefined;
    },
    enabled: Boolean(patientId),
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
 * Paginated investigations (lab tests & imaging) for the patient currently in
 * view (newest first), as an infinite query against the live endpoint. Scoped
 * by the real backend patient id (see `useResolvedPatientId`) and gated until
 * that id resolves, so the request never targets a stale fixture id.
 */
export function useInvestigations(
  filters: { status?: string; type?: string } = {},
) {
  const patientId = useResolvedPatientId();
  const query = useInfiniteQuery({
    queryKey: patientPortalQueryKeys.investigations(
      patientId ?? "none",
      filters.status,
      filters.type,
    ),
    queryFn: ({ pageParam }) =>
      fetchInvestigations({
        patientId: patientId as string,
        page: pageParam,
        limit: 10,
        status: filters.status,
        type: filters.type,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.flatMap((p) => p.data).length;
      return loaded < lastPage.meta.total ? allPages.length + 1 : undefined;
    },
    enabled: Boolean(patientId),
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
 * The real backend patient id for the patient currently in view, used by the
 * live (non-fixture) hooks. Resolves from the authenticated identity (not the
 * fixture profile store, so the other prototype screens are untouched): the
 * active profile id when it is a real accessible id, otherwise the account
 * holder (`patient_id`) or the first accessible patient. `undefined` while the
 * identity is still loading — callers gate their query with `enabled`.
 */
function useResolvedPatientId(): string | undefined {
  const { data: identity } = usePatientIdentity();
  const activeFixtureId = useActivePatientId();

  const accessible = identity?.accessible_patient_ids ?? [];
  return accessible.includes(activeFixtureId)
    ? activeFixtureId
    : (identity?.patient_id ?? accessible[0]);
}

/**
 * Live medications for the patient currently in view, scoped by the real
 * backend patient id and gated until that id resolves.
 */
export function useMedications() {
  const patientId = useResolvedPatientId();

  return useQuery({
    queryKey: patientPortalQueryKeys.medications(patientId ?? "none"),
    queryFn: () => fetchMedications(patientId as string),
    enabled: Boolean(patientId),
  });
}

/**
 * Read-only OB/GYN history (display-ready groups) for the patient currently in
 * view, scoped by the real backend patient id and gated until it resolves.
 */
export function usePatientHistory() {
  const patientId = useResolvedPatientId();

  return useQuery({
    queryKey: patientPortalQueryKeys.history(patientId ?? "none"),
    queryFn: () => fetchObgynHistory(patientId as string),
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
