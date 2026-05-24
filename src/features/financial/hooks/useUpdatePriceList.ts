"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/queryKeys";
import { getApiErrorMessage } from "@/common/errors/error";
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
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to update price list"));
    },
  });
}
