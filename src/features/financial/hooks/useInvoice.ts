"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { fetchInvoice } from "../lib/invoices.api";

export function useInvoice(id: string | null | undefined) {
  const orgId = useAuthContextStore((s) => s.organizationId);

  const query = useQuery({
    queryKey: queryKeys.financial.invoices.byId(id ?? ""),
    queryFn: async () => {
      const res = await fetchInvoice(orgId!, id!);
      return res.data;
    },
    enabled: !!id && !!orgId,
  });

  return {
    invoice: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}
