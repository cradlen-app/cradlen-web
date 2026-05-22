import type { ApiResponse } from "@/common/types/api.types";
import { apiAuthFetch } from "@/infrastructure/http/api";
import { CarePathDto } from "../types/care-paths.types";

export async function fetchCarePaths(
  specialtyCode: string,
  signal?: AbortSignal,
): Promise<CarePathDto[]> {
  const response = await apiAuthFetch<ApiResponse<CarePathDto[]>>(
    `/care-paths?specialtyCode=${encodeURIComponent(specialtyCode)}`,
    { signal },
  );
  return response.data;
}
