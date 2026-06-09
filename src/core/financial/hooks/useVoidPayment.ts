"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { financialQueryKeys } from "@/core/financial/queryKeys";
import { getApiErrorMessage } from "@/common/errors/error";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";

import { voidPayment } from "../lib/invoices.api";

export function useVoidPayment(invoiceId: string) {
  const qc = useQueryClient();
  const orgId = useAuthContextStore((s) => s.organizationId);

  return useMutation({
    mutationFn: (paymentId: string) =>
      voidPayment(orgId!, invoiceId, paymentId),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: financialQueryKeys.invoices.byId(invoiceId),
      });
      void qc.invalidateQueries({
        queryKey: financialQueryKeys.invoices.payments(invoiceId),
      });
      void qc.invalidateQueries({ queryKey: financialQueryKeys.invoices.all() });
      toast.success("Payment voided");
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to void payment"));
    },
  });
}
