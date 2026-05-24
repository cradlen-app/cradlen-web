"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/queryKeys";
import { getApiErrorMessage } from "@/common/errors/error";
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
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to remove price list item"));
    },
  });
}
