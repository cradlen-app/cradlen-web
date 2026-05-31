"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchVisitJourney } from "./journeys.api";
import type { JourneyDescriptorDto } from "../types/journey.types";

/**
 * The visit's active-journey descriptor (or null). Drives whether the workspace
 * renders a dynamic journey tab. Deduped by `["visit-journey", visitId]`.
 */
export function useVisitJourney(visitId: string | null | undefined) {
  return useQuery<JourneyDescriptorDto | null>({
    queryKey: ["visit-journey", visitId],
    queryFn: ({ signal }) => fetchVisitJourney(visitId!, signal),
    enabled: !!visitId,
    staleTime: 60 * 1000,
  });
}
