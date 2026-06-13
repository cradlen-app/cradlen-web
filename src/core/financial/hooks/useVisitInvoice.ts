"use client";

import { useQuery } from "@tanstack/react-query";
import { financialQueryKeys } from "@/core/financial/queryKeys";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { fetchInvoices } from "../lib/invoices.api";

/**
 * The active (non-VOID) invoice for a visit (encounter), if one exists. Billing
 * is per-visit — one open invoice per visit, created at booking — so reopening
 * the drawer on the same visit shows the existing invoice rather than building a
 * duplicate.
 */
export function useVisitInvoice(visitId: string | undefined) {
  const orgId = useAuthContextStore((s) => s.organizationId);

  const query = useQuery({
    queryKey: financialQueryKeys.invoices.list(orgId ?? "", {
      visit_ids: visitId ? [visitId] : undefined,
    }),
    queryFn: async () => {
      const res = await fetchInvoices(orgId!, { visit_ids: [visitId!] });
      return res.data;
    },
    enabled: !!orgId && !!visitId,
  });

  const invoice = (query.data ?? []).find((i) => i.status !== "VOID") ?? null;

  return { invoice, isLoading: query.isLoading };
}
