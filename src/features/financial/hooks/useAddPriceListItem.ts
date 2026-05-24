"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { addPriceListItem } from "../lib/pricing.api";
import type { CreatePriceListItemPayload } from "../types/financial.types";

export function useAddPriceListItem(priceListId: string) {
  const qc = useQueryClient();
  const orgId = useAuthContextStore((s) => s.organizationId);

  return useMutation({
    mutationFn: (payload: CreatePriceListItemPayload) =>
      addPriceListItem(orgId!, priceListId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: queryKeys.financial.pricing.priceListItems(priceListId),
      });
    },
  });
}
