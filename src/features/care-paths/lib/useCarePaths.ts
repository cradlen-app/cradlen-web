"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCarePaths } from "./care-paths.api";
import type { CarePathDto } from "../types/care-paths.types";

/**
 * Shared care-paths query (deduped by `["care-paths", specialtyCode]`). Used by
 * the `case_path` pill picker and the examination shell (to resolve the
 * selected path's `history_section_codes`).
 */
export function useCarePaths(specialtyCode: string | null | undefined) {
  return useQuery<CarePathDto[]>({
    queryKey: ["care-paths", specialtyCode],
    queryFn: ({ signal }) => fetchCarePaths(specialtyCode!, signal),
    enabled: !!specialtyCode,
    staleTime: 5 * 60 * 1000,
  });
}
