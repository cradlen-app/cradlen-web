"use client";

import { useQuery } from "@tanstack/react-query";
import { financialQueryKeys } from "@/core/financial/queryKeys";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { fetchInvoices } from "../lib/invoices.api";
import type { InvoiceFilters } from "../types/financial.types";

export function useInvoices(
  filters?: InvoiceFilters,
  options?: { refetchInterval?: number },
) {
  const orgId = useAuthContextStore((s) => s.organizationId);

  const query = useQuery({
    queryKey: financialQueryKeys.invoices.list(orgId ?? "", filters ?? {}),
    queryFn: async () => {
      const res = await fetchInvoices(orgId!, filters);
      return res.data;
    },
    enabled: !!orgId,
    refetchInterval: options?.refetchInterval,
  });

  return {
    invoices: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
