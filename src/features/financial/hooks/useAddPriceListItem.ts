"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/queryKeys";
import { getApiErrorMessage } from "@/common/errors/error";
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
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to add price list item"));
    },
  });
}
