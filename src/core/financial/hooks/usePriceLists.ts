"use client";

import { useQuery } from "@tanstack/react-query";
import { financialQueryKeys } from "@/core/financial/queryKeys";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { fetchPriceLists } from "../lib/pricing.api";

export function usePriceLists(branchId?: string) {
  const orgId = useAuthContextStore((s) => s.organizationId);

  const query = useQuery({
    queryKey: financialQueryKeys.pricing.priceLists(orgId ?? "", branchId),
    queryFn: async () => {
      const res = await fetchPriceLists(orgId!, branchId);
      return res.data;
    },
    enabled: !!orgId,
  });

  return {
    priceLists: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
