"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { financialQueryKeys } from "@/core/financial/queryKeys";
import { getApiErrorMessage } from "@/common/errors/error";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { deletePriceList } from "../lib/pricing.api";

export function useDeletePriceList() {
  const qc = useQueryClient();
  const orgId = useAuthContextStore((s) => s.organizationId);

  return useMutation({
    mutationFn: (id: string) => deletePriceList(orgId!, id),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: financialQueryKeys.pricing.priceLists(orgId ?? ""),
      });
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to delete price list"));
    },
  });
}
