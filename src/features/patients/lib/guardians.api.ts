import { apiAuthFetch } from "@/infrastructure/http/api";

export interface GuardianSearchResult {
  id: string;
  full_name: string;
  national_id: string | null;
  phone_number: string | null;
}

export interface GuardianListResponse {
  data: GuardianSearchResult[];
}

export function searchGuardians(
  query: string,
  limit = 20,
): Promise<GuardianListResponse> {
  const params = new URLSearchParams({ search: query, limit: String(limit) });
  return apiAuthFetch<GuardianListResponse>(`/guardians?${params.toString()}`);
}
