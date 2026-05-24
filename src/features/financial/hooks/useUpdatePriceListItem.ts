"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/queryKeys";
import { getApiErrorMessage } from "@/common/errors/error";
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
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to update price list item"));
    },
  });
}
