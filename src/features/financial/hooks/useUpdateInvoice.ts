"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
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
      void qc.invalidateQueries({ queryKey: queryKeys.financial.invoices.byId(vars.id) });
      void qc.invalidateQueries({ queryKey: queryKeys.financial.invoices.all() });
    },
  });
}
