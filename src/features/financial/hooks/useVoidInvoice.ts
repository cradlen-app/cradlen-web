"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { voidInvoice } from "../lib/invoices.api";

export function useVoidInvoice() {
  const qc = useQueryClient();
  const orgId = useAuthContextStore((s) => s.organizationId);

  return useMutation({
    mutationFn: (id: string) => voidInvoice(orgId!, id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: queryKeys.financial.invoices.byId(id) });
      void qc.invalidateQueries({ queryKey: queryKeys.financial.invoices.all() });
    },
  });
}
