"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/queryKeys";
import { getApiErrorMessage } from "@/common/errors/error";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { recordPayment } from "../lib/invoices.api";
import type { RecordPaymentPayload } from "../types/financial.types";

export function useRecordPayment() {
  const qc = useQueryClient();
  const orgId = useAuthContextStore((s) => s.organizationId);

  return useMutation({
    mutationFn: ({
      invoiceId,
      payload,
    }: {
      invoiceId: string;
      payload: RecordPaymentPayload;
    }) => recordPayment(orgId!, invoiceId, payload),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({
        queryKey: queryKeys.financial.invoices.byId(vars.invoiceId),
      });
      void qc.invalidateQueries({
        queryKey: queryKeys.financial.invoices.payments(vars.invoiceId),
      });
      void qc.invalidateQueries({ queryKey: queryKeys.financial.invoices.all() });
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to record payment"));
    },
  });
}
