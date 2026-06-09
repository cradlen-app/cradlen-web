"use client";

import { useQuery } from "@tanstack/react-query";

import { financialQueryKeys } from "@/core/financial/queryKeys";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";

import { fetchReport } from "../lib/reporting.api";
import type { ReportParams } from "../types/financial.types";

/**
 * Generic financial report hook. `name` is the report endpoint segment
 * (e.g. "revenue", "daily-revenue", "revenue-by-service"). The caller
 * provides the expected response type.
 */
export function useFinancialReport<T>(
  name: string,
  params?: ReportParams,
  options?: { enabled?: boolean },
) {
  const orgId = useAuthContextStore((s) => s.organizationId);

  const query = useQuery({
    queryKey: financialQueryKeys.reports.report(name, orgId ?? "", params),
    queryFn: async () => {
      const res = await fetchReport<T>(orgId!, name, params);
      return res.data;
    },
    enabled: !!orgId && (options?.enabled ?? true),
    staleTime: 60 * 1000,
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
  };
}
