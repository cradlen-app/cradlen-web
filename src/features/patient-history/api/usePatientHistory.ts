"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/infrastructure/http/api";
import {
  getPatientHistory,
  patchPatientHistory,
  type PatchPatientHistoryArgs,
} from "./patient-history.api";

export const patientHistoryKey = (endpointPath: string) =>
  ["patient-history", endpointPath] as const;

export function usePatientHistory(endpointPath: string | null) {
  return useQuery({
    queryKey: endpointPath
      ? patientHistoryKey(endpointPath)
      : (["patient-history", "disabled"] as const),
    queryFn: async () => {
      const res = await getPatientHistory(endpointPath!);
      return res.data;
    },
    enabled: !!endpointPath,
    staleTime: 30_000,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 404) return false;
      return failureCount < 2;
    },
  });
}

export function usePatchPatientHistory(endpointPath: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: Omit<PatchPatientHistoryArgs, "endpointPath">) => {
      const res = await patchPatientHistory({ endpointPath, ...args });
      return res.data;
    },
    onSuccess: (data) => {
      qc.setQueryData(patientHistoryKey(endpointPath), data);
    },
  });
}