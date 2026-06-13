"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/queryKeys";
import { ApiError } from "@/infrastructure/http/api";

import { fetchPrescriptionPrint } from "../lib/prescriptions.api";

/**
 * Loads the printable prescription for a visit. A 404 (visit completed with no
 * medications) is a normal terminal state, not a transient failure — surfaced
 * via `isNotFound` and not retried.
 */
export function usePrescriptionPrint(visitId: string | undefined) {
  const query = useQuery({
    queryKey: queryKeys.visits.prescriptionPrint(visitId ?? ""),
    queryFn: async () => {
      const res = await fetchPrescriptionPrint(visitId!);
      return res.data;
    },
    enabled: !!visitId,
    retry: (count, error) =>
      !(error instanceof ApiError && error.status === 404) && count < 2,
  });

  const isNotFound =
    query.error instanceof ApiError && query.error.status === 404;

  return {
    print: query.data ?? null,
    isLoading: query.isLoading,
    isNotFound,
    error: isNotFound ? null : query.error,
  };
}
