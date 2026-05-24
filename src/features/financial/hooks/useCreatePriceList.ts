"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
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
        queryKey: queryKeys.financial.pricing.priceLists(orgId ?? ""),
      });
    },
  });
}
