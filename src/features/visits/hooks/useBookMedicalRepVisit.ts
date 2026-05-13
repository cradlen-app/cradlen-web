"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bookMedicalRepVisit } from "../lib/visits.api";
import { queryKeys } from "@/lib/queryKeys";
import type {
  BookMedicalRepVisitRequest,
  BookMedicalRepVisitResponse,
} from "../types/visits.api.types";

export function useBookMedicalRepVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      body: BookMedicalRepVisitRequest,
    ): Promise<BookMedicalRepVisitResponse> => bookMedicalRepVisit(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.visits.all() });
      qc.invalidateQueries({ queryKey: queryKeys.calendar.all() });
    },
  });
}