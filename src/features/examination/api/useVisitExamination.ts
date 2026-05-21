"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/infrastructure/http/api";
import {
  getVisitExamination,
  patchVisitExamination,
  type PatchVisitExaminationArgs,
} from "./examination.api";

export const visitExaminationKey = (endpointPath: string) =>
  ["visit-examination", endpointPath] as const;

export function useVisitExamination(endpointPath: string | null) {
  return useQuery({
    queryKey: endpointPath
      ? visitExaminationKey(endpointPath)
      : (["visit-examination", "disabled"] as const),
    queryFn: async ({ signal }) => {
      const res = await getVisitExamination(endpointPath!, signal);
      return res.data;
    },
    enabled: !!endpointPath,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 404) return false;
      return failureCount < 2;
    },
  });
}

export function usePatchVisitExamination(endpointPath: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: Omit<PatchVisitExaminationArgs, "endpointPath">) => {
      await qc.cancelQueries({ queryKey: visitExaminationKey(endpointPath) });
      const res = await patchVisitExamination({ endpointPath, ...args });
      return res.data;
    },
    onSuccess: (data) => {
      void qc.cancelQueries({ queryKey: visitExaminationKey(endpointPath) });
      qc.setQueryData(visitExaminationKey(endpointPath), data);
    },
  });
}
