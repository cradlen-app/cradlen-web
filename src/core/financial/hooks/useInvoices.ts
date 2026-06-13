"use client";

import { useQuery } from "@tanstack/react-query";
import { financialQueryKeys } from "@/core/financial/queryKeys";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { fetchInvoices } from "../lib/invoices.api";
import type { InvoiceFilters } from "../types/financial.types";

export function useInvoices(
  filters?: InvoiceFilters,
  options?: { refetchInterval?: number; enabled?: boolean },
) {
  const orgId = useAuthContextStore((s) => s.organizationId);

  const query = useQuery({
    queryKey: financialQueryKeys.invoices.list(orgId ?? "", filters ?? {}),
    queryFn: async () => {
      const res = await fetchInvoices(orgId!, filters);
      return { data: res.data, meta: res.meta };
    },
    enabled: !!orgId && (options?.enabled ?? true),
    placeholderData: (prev) => prev,
    refetchInterval: options?.refetchInterval,
  });

  const meta = query.data?.meta;

  return {
    invoices: query.data?.data ?? [],
    total: meta?.total,
    page: meta?.page,
    limit: meta?.limit,
    totalPages: meta?.totalPages,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
  };
}
