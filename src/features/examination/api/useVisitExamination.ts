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
    queryFn: async () => {
      const res = await getVisitExamination(endpointPath!);
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

export function usePatchVisitExamination(endpointPath: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: Omit<PatchVisitExaminationArgs, "endpointPath">) => {
      const res = await patchVisitExamination({ endpointPath, ...args });
      return res.data;
    },
    onSuccess: (data) => {
      qc.setQueryData(visitExaminationKey(endpointPath), data);
    },
  });
}
