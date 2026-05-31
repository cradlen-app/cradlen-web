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

/** A 412 (or 409 STALE_VERSION) from the examination PATCH — the optimistic
 *  concurrency token didn't match the row's current version. */
function isStaleVersionError(err: unknown): boolean {
  if (!(err instanceof ApiError)) return false;
  if (err.status === 412) return true;
  if (err.status === 409) {
    const body = err.body as { error?: { code?: string } } | undefined;
    return body?.error?.code === "STALE_VERSION";
  }
  return false;
}

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
    staleTime: 0,
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
      try {
        const res = await patchVisitExamination({ endpointPath, ...args });
        return res.data;
      } catch (err) {
        if (!isStaleVersionError(err)) throw err;
        // Single-writer rebase: a stale token here is almost always an upstream
        // retry of the slow PATCH that already applied (the first attempt bumped
        // the version). Re-read the current version and replay the same edits
        // once. Field writes are absolute, so replaying is idempotent for data.
        const fresh = await getVisitExamination(endpointPath);
        const res = await patchVisitExamination({
          endpointPath,
          ifMatchVersion: fresh.data.examination_version,
          body: args.body,
        });
        return res.data;
      }
    },
    onSuccess: (data) => {
      void qc.cancelQueries({ queryKey: visitExaminationKey(endpointPath) });
      qc.setQueryData(visitExaminationKey(endpointPath), data);
    },
  });
}
