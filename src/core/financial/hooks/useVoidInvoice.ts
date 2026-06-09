"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { financialQueryKeys } from "@/core/financial/queryKeys";
import { getApiErrorMessage } from "@/common/errors/error";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { voidInvoice } from "../lib/invoices.api";

export function useVoidInvoice() {
  const qc = useQueryClient();
  const orgId = useAuthContextStore((s) => s.organizationId);

  return useMutation({
    mutationFn: (id: string) => voidInvoice(orgId!, id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: financialQueryKeys.invoices.byId(id) });
      void qc.invalidateQueries({ queryKey: financialQueryKeys.invoices.all() });
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to void invoice"));
    },
  });
}
