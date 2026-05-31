import type { ApiResponse } from "@/common/types/api.types";
import { apiAuthFetch } from "@/infrastructure/http/api";
import type { JourneyDescriptorDto } from "../types/journey.types";

/**
 * The active-journey descriptor for a visit's workspace. Returns `null` when
 * the visit has no journey (backend wraps it as `{ data: null }`).
 */
export async function fetchVisitJourney(
  visitId: string,
  signal?: AbortSignal,
): Promise<JourneyDescriptorDto | null> {
  const response = await apiAuthFetch<ApiResponse<JourneyDescriptorDto | null>>(
    `/visits/${encodeURIComponent(visitId)}/journey`,
    { signal },
  );
  return response.data;
}
