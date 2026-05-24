"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { updatePriceList } from "../lib/pricing.api";
import type { UpdatePriceListPayload } from "../types/financial.types";

export function useUpdatePriceList() {
  const qc = useQueryClient();
  const orgId = useAuthContextStore((s) => s.organizationId);

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePriceListPayload }) =>
      updatePriceList(orgId!, id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: queryKeys.financial.pricing.priceLists(orgId ?? ""),
      });
    },
  });
}
