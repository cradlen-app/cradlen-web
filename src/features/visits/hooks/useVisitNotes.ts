"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { fetchVisitNotes } from "../lib/visit-notes.api";

/**
 * The caller's own notes for one visit. Uses `useQuery` rather than
 * `useSuspenseQuery` so the rail can render its own inline loading and error
 * states — the workspace pages have no Suspense boundary at that slot.
 */
export function useVisitNotes(visitId: string) {
  return useQuery({
    queryKey: queryKeys.visitNotes.forVisit(visitId),
    queryFn: () => fetchVisitNotes(visitId),
    enabled: !!visitId,
  });
}
