"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { createVisitNote } from "../lib/visit-notes.api";
import type { VisitNote } from "../types/visits-notes.types";

type Options = {
  onSuccess?: (note: VisitNote) => void;
  onError?: (error: unknown) => void;
};

export function useCreateVisitNote(visitId: string, options: Options = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, onError } = options;

  return useMutation({
    mutationFn: (content: string) => createVisitNote(visitId, content),
    onSuccess: (note) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.visitNotes.all() });
      onSuccess?.(note);
    },
    onError,
  });
}
