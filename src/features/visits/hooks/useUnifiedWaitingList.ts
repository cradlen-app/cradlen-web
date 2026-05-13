"use client";

import { useMemo } from "react";
import { useWaitingList } from "./useWaitingList";
import { useMedRepWaitingList } from "./useMedRepWaitingList";
import type { Visit, WaitingListPage } from "../types/visits.types";

type Params = {
  branchId: string | null | undefined;
  assignedToMe?: boolean;
  page: number;
  limit?: number;
};

const STATUS_ORDER: Record<string, number> = {
  CHECKED_IN: 0,
  SCHEDULED: 1,
};

function compareWaitingVisits(a: Visit, b: Visit): number {
  const sa = STATUS_ORDER[a.status] ?? 99;
  const sb = STATUS_ORDER[b.status] ?? 99;
  if (sa !== sb) return sa - sb;
  if (a.queueNumber && b.queueNumber && a.queueNumber !== b.queueNumber) {
    return a.queueNumber - b.queueNumber;
  }
  const ta = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
  const tb = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
  return ta - tb;
}

export function useUnifiedWaitingList(params: Params) {
  const patient = useWaitingList(params);
  const medRep = useMedRepWaitingList(params);

  const patientSettled = !patient.isLoading;
  const medRepSettled = !medRep.isLoading;

  const data = useMemo<WaitingListPage | undefined>(() => {
    // Render as soon as at least one side has settled (success or error).
    // A failed side contributes an empty array rather than blocking the panel.
    if (!patientSettled && !medRepSettled) return undefined;
    const rows = [
      ...(patient.data?.rows ?? []),
      ...(medRep.data?.rows ?? []),
    ].sort(compareWaitingVisits);
    return {
      rows,
      page: params.page,
      total: (patient.data?.total ?? 0) + (medRep.data?.total ?? 0),
      totalPages: Math.max(
        patient.data?.totalPages ?? 1,
        medRep.data?.totalPages ?? 1,
      ),
    };
  }, [patient.data, medRep.data, patientSettled, medRepSettled, params.page]);

  return {
    data,
    isLoading: patient.isLoading && medRep.isLoading,
    // Only surface "error" when BOTH sides fail. A partial failure renders the
    // remaining rows; an empty waiting list shows the empty state.
    isError: patient.isError && medRep.isError,
    refetch: () => {
      void patient.refetch();
      void medRep.refetch();
    },
  };
}