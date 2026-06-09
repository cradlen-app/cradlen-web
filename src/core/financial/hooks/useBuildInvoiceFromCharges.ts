"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { financialQueryKeys } from "@/core/financial/queryKeys";
import { getApiErrorMessage } from "@/common/errors/error";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";

import { buildInvoiceFromCharges } from "../lib/invoices.api";
import type { BuildInvoiceFromChargesPayload } from "../types/financial.types";

export function useBuildInvoiceFromCharges() {
  const qc = useQueryClient();
  const orgId = useAuthContextStore((s) => s.organizationId);

  return useMutation({
    mutationFn: (payload: BuildInvoiceFromChargesPayload) =>
      buildInvoiceFromCharges(orgId!, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: financialQueryKeys.charges.all() });
      void qc.invalidateQueries({
        queryKey: financialQueryKeys.invoices.all(),
      });
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to build invoice from charges"));
    },
  });
}
