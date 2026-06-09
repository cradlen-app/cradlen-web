"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { financialQueryKeys } from "@/core/financial/queryKeys";
import { getApiErrorMessage } from "@/common/errors/error";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { createPriceList } from "../lib/pricing.api";
import type { CreatePriceListPayload } from "../types/financial.types";

export function useCreatePriceList() {
  const qc = useQueryClient();
  const orgId = useAuthContextStore((s) => s.organizationId);

  return useMutation({
    mutationFn: (payload: CreatePriceListPayload) => createPriceList(orgId!, payload),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: financialQueryKeys.pricing.priceLists(orgId ?? ""),
      });
      toast.success("Price list created");
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to create price list"));
    },
  });
}
