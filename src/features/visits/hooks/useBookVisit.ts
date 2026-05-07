"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bookVisit } from "../lib/visits.api";
import { ApiError } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { toast } from "sonner";
import type { BookVisitRequest } from "../types/visits.api.types";

export function useBookVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: BookVisitRequest) => bookVisit(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.visits.all() });
    },
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? (error.messages[0] ?? "Failed to book visit")
          : "Failed to book visit";
      toast.error(message);
    },
  });
}
