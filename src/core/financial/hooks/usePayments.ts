"use client";

import { useQuery } from "@tanstack/react-query";
import { financialQueryKeys } from "@/core/financial/queryKeys";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { fetchPayments } from "../lib/invoices.api";

export function usePayments(invoiceId: string | undefined) {
  const orgId = useAuthContextStore((s) => s.organizationId) ?? "";

  const query = useQuery({
    queryKey: financialQueryKeys.invoices.payments(invoiceId ?? ""),
    queryFn: () => fetchPayments(orgId, invoiceId!),
    enabled: !!invoiceId && !!orgId,
  });

  return {
    payments: query.data?.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
