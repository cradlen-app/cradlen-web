"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { financialQueryKeys } from "@/core/financial/queryKeys";
import { getApiErrorMessage } from "@/common/errors/error";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";

import {
  createRefund,
  fetchRefundsForInvoice,
  voidRefund,
} from "../lib/refunds.api";
import type { CreateRefundPayload } from "../types/financial.types";

export function useRefunds(invoiceId: string | undefined) {
  const orgId = useAuthContextStore((s) => s.organizationId);

  const query = useQuery({
    queryKey: financialQueryKeys.refunds.list(orgId ?? "", { paymentId: invoiceId }),
    queryFn: async () => {
      const res = await fetchRefundsForInvoice(orgId!, invoiceId!);
      return res.data;
    },
    enabled: !!orgId && !!invoiceId,
  });

  return {
    refunds: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}

function useInvalidateAfterRefund(invoiceId: string | undefined) {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: financialQueryKeys.refunds.all() });
    void qc.invalidateQueries({ queryKey: financialQueryKeys.invoices.all() });
    if (invoiceId) {
      void qc.invalidateQueries({
        queryKey: financialQueryKeys.invoices.byId(invoiceId),
      });
      void qc.invalidateQueries({
        queryKey: financialQueryKeys.invoices.payments(invoiceId),
      });
    }
  };
}

export function useCreateRefund(invoiceId?: string) {
  const orgId = useAuthContextStore((s) => s.organizationId);
  const invalidate = useInvalidateAfterRefund(invoiceId);

  return useMutation({
    mutationFn: (payload: CreateRefundPayload) => createRefund(orgId!, payload),
    onSuccess: () => {
      invalidate();
      toast.success("Refund recorded");
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to record refund"));
    },
  });
}

export function useVoidRefund(invoiceId?: string) {
  const orgId = useAuthContextStore((s) => s.organizationId);
  const invalidate = useInvalidateAfterRefund(invoiceId);

  return useMutation({
    mutationFn: (id: string) => voidRefund(orgId!, id),
    onSuccess: invalidate,
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to void refund"));
    },
  });
}
