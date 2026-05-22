import { apiAuthFetch } from "@/infrastructure/http/api";
import { CarePathDto } from "../types/care-paths.types";

export async function fetchCarePaths(specialtyCode: string): Promise<CarePathDto[]> {
  const response = await apiAuthFetch<{ data: CarePathDto[] }>(
    `/care-paths?specialtyCode=${encodeURIComponent(specialtyCode)}`,
  );
  return response.data;
}