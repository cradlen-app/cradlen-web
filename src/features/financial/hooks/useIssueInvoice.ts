"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/queryKeys";
import { getApiErrorMessage } from "@/common/errors/error";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { issueInvoice } from "../lib/invoices.api";

export function useIssueInvoice() {
  const qc = useQueryClient();
  const orgId = useAuthContextStore((s) => s.organizationId);

  return useMutation({
    mutationFn: (id: string) => issueInvoice(orgId!, id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: queryKeys.financial.invoices.byId(id) });
      void qc.invalidateQueries({ queryKey: queryKeys.financial.invoices.all() });
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to issue invoice"));
    },
  });
}
