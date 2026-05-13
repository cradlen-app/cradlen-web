"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bookVisit } from "../lib/visits.api";
import { queryKeys } from "@/lib/queryKeys";
import type {
  BookVisitRequest,
  BookVisitResponse,
} from "../types/visits.api.types";

export function useBookVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: BookVisitRequest): Promise<BookVisitResponse> =>
      bookVisit(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.visits.all() });
      qc.invalidateQueries({ queryKey: queryKeys.calendar.all() });
    },
  });
}