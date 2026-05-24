"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { removePriceListItem } from "../lib/pricing.api";

export function useRemovePriceListItem(priceListId: string) {
  const qc = useQueryClient();
  const orgId = useAuthContextStore((s) => s.organizationId);

  return useMutation({
    mutationFn: (itemId: string) => removePriceListItem(orgId!, priceListId, itemId),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: queryKeys.financial.pricing.priceListItems(priceListId),
      });
    },
  });
}
