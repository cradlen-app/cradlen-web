"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { deletePriceList } from "../lib/pricing.api";

export function useDeletePriceList() {
  const qc = useQueryClient();
  const orgId = useAuthContextStore((s) => s.organizationId);

  return useMutation({
    mutationFn: (id: string) => deletePriceList(orgId!, id),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: queryKeys.financial.pricing.priceLists(orgId ?? ""),
      });
    },
  });
}
