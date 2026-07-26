"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { deleteVisitNote } from "../lib/visit-notes.api";

type Options = {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
};

export function useDeleteVisitNote(visitId: string, options: Options = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, onError } = options;

  return useMutation({
    mutationFn: (noteId: string) => deleteVisitNote(visitId, noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.visitNotes.all() });
      onSuccess?.();
    },
    onError,
  });
}
