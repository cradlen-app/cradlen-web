"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/queryKeys";
import { getApiErrorMessage } from "@/common/errors/error";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { createInvoice } from "../lib/invoices.api";
import type { CreateInvoicePayload } from "../types/financial.types";

export function useCreateInvoice() {
  const qc = useQueryClient();
  const orgId = useAuthContextStore((s) => s.organizationId);

  return useMutation({
    mutationFn: (payload: CreateInvoicePayload) => createInvoice(orgId!, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.financial.invoices.all() });
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to create invoice"));
    },
  });
}
