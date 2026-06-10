"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { financialQueryKeys } from "@/core/financial/queryKeys";
import { getApiErrorMessage } from "@/common/errors/error";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";

import { appendChargesToInvoice } from "../lib/invoices.api";
import type { AppendChargesPayload } from "../types/financial.types";

/**
 * Append a patient's open (PENDING) charges to an existing issued invoice — the
 * post-issue accrual path (a service the doctor added mid-visit, or a later
 * session of a multi-visit case). Charges flip to INVOICED and the invoice
 * reopens for the new balance.
 */
export function useAppendChargesToInvoice() {
  const qc = useQueryClient();
  const orgId = useAuthContextStore((s) => s.organizationId);

  return useMutation({
    mutationFn: ({
      invoiceId,
      payload,
    }: {
      invoiceId: string;
      payload: AppendChargesPayload;
    }) => appendChargesToInvoice(orgId!, invoiceId, payload),
    onSuccess: (res, { invoiceId }) => {
      void qc.invalidateQueries({ queryKey: financialQueryKeys.charges.all() });
      void qc.invalidateQueries({
        queryKey: financialQueryKeys.invoices.all(),
      });
      void qc.invalidateQueries({
        queryKey: financialQueryKeys.invoices.byId(invoiceId),
      });
      void qc.invalidateQueries({
        queryKey: financialQueryKeys.invoices.payments(invoiceId),
      });
      void res;
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to add charges to invoice"));
    },
  });
}
