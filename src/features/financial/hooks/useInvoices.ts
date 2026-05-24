"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { fetchInvoices } from "../lib/invoices.api";
import type { InvoiceFilters } from "../types/financial.types";

export function useInvoices(filters?: InvoiceFilters) {
  const orgId = useAuthContextStore((s) => s.organizationId);

  const query = useQuery({
    queryKey: queryKeys.financial.invoices.list(orgId ?? "", filters ?? {}),
    queryFn: async () => {
      const res = await fetchInvoices(orgId!, filters);
      return res.data;
    },
    enabled: !!orgId,
  });

  return {
    invoices: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
