"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { updatePriceListItem } from "../lib/pricing.api";
import type { UpdatePriceListItemPayload } from "../types/financial.types";

export function useUpdatePriceListItem(priceListId: string) {
  const qc = useQueryClient();
  const orgId = useAuthContextStore((s) => s.organizationId);

  return useMutation({
    mutationFn: ({ itemId, payload }: { itemId: string; payload: UpdatePriceListItemPayload }) =>
      updatePriceListItem(orgId!, priceListId, itemId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: queryKeys.financial.pricing.priceListItems(priceListId),
      });
    },
  });
}
