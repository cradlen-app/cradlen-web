"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { bookVisit } from "../lib/visits.api";
import type {
  BookVisitResponse,
  QuickStartVisitRequest,
} from "../types/visits.api.types";

/**
 * Doctor self-start: a single POST /visits/book carrying `start_now`, reusing
 * the whole booking transaction (journey/episode resolution, the duplicate-visit
 * guard, charge capture, org enrollment). The API lands the visit directly in
 * IN_CONSULTATION, so no follow-up PATCH /status is needed.
 *
 * Kept separate from `useBookVisit` — that one is consumed by the reception
 * drawer via `useSubmitVisit`, and this flow invalidates caches reception's
 * doesn't touch (the patient's journey/history and directory rows, whose
 * enrollment flips PENDING → ACTIVE as a side effect of starting).
 */
export function useQuickStartVisit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: QuickStartVisitRequest): Promise<BookVisitResponse> =>
      bookVisit(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.visits.all() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.calendar.all() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.patients.all() });
    },
  });
}
