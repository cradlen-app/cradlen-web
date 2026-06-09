"use client";

import { useQuery } from "@tanstack/react-query";
import { financialQueryKeys } from "@/core/financial/queryKeys";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { fetchPriceListItems } from "../lib/pricing.api";

export function usePriceListItems(priceListId: string | null | undefined) {
  const orgId = useAuthContextStore((s) => s.organizationId);

  const query = useQuery({
    queryKey: financialQueryKeys.pricing.priceListItems(priceListId ?? ""),
    queryFn: async () => {
      const res = await fetchPriceListItems(orgId!, priceListId!);
      return res.data;
    },
    enabled: !!orgId && !!priceListId,
  });

  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
