"use client";

import { useQuery } from "@tanstack/react-query";

import { financialQueryKeys } from "@/core/financial/queryKeys";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";

import {
  fetchReceiptPrint,
  fetchReceiptsForInvoice,
} from "../lib/receipts.api";

export function useReceipts(invoiceId: string | undefined) {
  const orgId = useAuthContextStore((s) => s.organizationId);

  const query = useQuery({
    queryKey: financialQueryKeys.receipts.byId(invoiceId ?? ""),
    queryFn: async () => {
      const res = await fetchReceiptsForInvoice(orgId!, invoiceId!);
      return res.data;
    },
    enabled: !!orgId && !!invoiceId,
  });

  return {
    receipts: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useReceiptPrint(receiptId: string | undefined) {
  const orgId = useAuthContextStore((s) => s.organizationId);

  const query = useQuery({
    queryKey: financialQueryKeys.receipts.print(receiptId ?? ""),
    queryFn: async () => {
      const res = await fetchReceiptPrint(orgId!, receiptId!);
      return res.data;
    },
    enabled: !!orgId && !!receiptId,
  });

  return {
    receipt: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
  };
}
