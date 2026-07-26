"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { updateVisitNote } from "../lib/visit-notes.api";
import type { VisitNote } from "../types/visits-notes.types";

type Options = {
  onSuccess?: (note: VisitNote) => void;
  onError?: (error: unknown) => void;
};

type Vars = { noteId: string; content: string };

export function useUpdateVisitNote(visitId: string, options: Options = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, onError } = options;

  return useMutation({
    mutationFn: ({ noteId, content }: Vars) =>
      updateVisitNote(visitId, noteId, content),
    onSuccess: (note) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.visitNotes.all() });
      onSuccess?.(note);
    },
    onError,
  });
}
