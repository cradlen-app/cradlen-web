"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bookVisit } from "../lib/visits.api";
import type { BookVisitRequest } from "../types/visits.api.types";

export function useBookVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: BookVisitRequest) => bookVisit(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visits"] });
    },
  });
}
