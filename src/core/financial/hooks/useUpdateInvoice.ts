"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { financialQueryKeys } from "@/core/financial/queryKeys";
import { getApiErrorMessage } from "@/common/errors/error";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { updateInvoice } from "../lib/invoices.api";
import type { UpdateInvoicePayload } from "../types/financial.types";

export function useUpdateInvoice() {
  const qc = useQueryClient();
  const orgId = useAuthContextStore((s) => s.organizationId);

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateInvoicePayload }) =>
      updateInvoice(orgId!, id, payload),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: financialQueryKeys.invoices.byId(vars.id) });
      void qc.invalidateQueries({ queryKey: financialQueryKeys.invoices.all() });
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to update invoice"));
    },
  });
}
