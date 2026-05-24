"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { fetchPriceLists } from "../lib/pricing.api";

export function usePriceLists(branchId?: string) {
  const orgId = useAuthContextStore((s) => s.organizationId);

  const query = useQuery({
    queryKey: queryKeys.financial.pricing.priceLists(orgId ?? "", branchId),
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
