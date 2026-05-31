"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/infrastructure/http/api";
import {
  getJourneyClinical,
  patchJourneyClinical,
  type PatchJourneyClinicalArgs,
} from "./journey-clinical.api";

export const journeyClinicalKey = (visitId: string, journeyId: string) =>
  ["journey-clinical", visitId, journeyId] as const;

export function useJourneyClinical(
  visitId: string | null,
  journeyId: string | null,
) {
  const enabled = !!visitId && !!journeyId;
  return useQuery({
    queryKey: enabled
      ? journeyClinicalKey(visitId, journeyId)
      : (["journey-clinical", "disabled"] as const),
    queryFn: async ({ signal }) => {
      const res = await getJourneyClinical(visitId!, journeyId!, signal);
      return res.data;
    },
    enabled,
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 404) return false;
      return failureCount < 2;
    },
  });
}

export function usePatchJourneyClinical(visitId: string, journeyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      args: Omit<PatchJourneyClinicalArgs, "visitId" | "journeyId">,
    ) => {
      await qc.cancelQueries({ queryKey: journeyClinicalKey(visitId, journeyId) });
      const res = await patchJourneyClinical({ visitId, journeyId, ...args });
      return res.data;
    },
    onSuccess: (data) => {
      void qc.cancelQueries({ queryKey: journeyClinicalKey(visitId, journeyId) });
      qc.setQueryData(journeyClinicalKey(visitId, journeyId), data);
    },
  });
}
