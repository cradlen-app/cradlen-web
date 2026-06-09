"use client";

import { useMemo } from "react";
import { useUnifiedWaitingList } from "@/features/visits/hooks/useUnifiedWaitingList";
import type { Visit } from "@/features/visits/types/visits.types";
import { useInvoices } from "./useInvoices";
import type { Invoice } from "../types/financial.types";

export type BillingQueueItem = {
  visit: Visit;
  invoice: Invoice | undefined;
};

/**
 * Today's reception billing queue: each waiting-list visit paired with its
 * invoice (if any), split into `pending` (no invoice or a DRAFT — still needs
 * collecting) and `invoiced`. Shared by the visits-page invoice badge and the
 * InvoicePanel so the count and the list never drift.
 */
export function useBillingQueue(branchId: string | null | undefined) {
  const today = new Date().toISOString().split("T")[0]!;

  const waitingList = useUnifiedWaitingList({
    branchId,
    assignedToMe: false,
    page: 1,
    limit: 100,
  });

  const { invoices, isLoading: invoicesLoading } = useInvoices({
    branch_id: branchId ?? undefined,
    date_from: today,
    date_to: today,
    limit: 200,
  });

  const invoiceByVisitId = useMemo<Map<string, Invoice>>(() => {
    const map = new Map<string, Invoice>();
    for (const inv of invoices ?? []) {
      if (inv.visit_id) map.set(inv.visit_id, inv);
    }
    return map;
  }, [invoices]);

  const { pending, invoiced } = useMemo<{
    pending: BillingQueueItem[];
    invoiced: BillingQueueItem[];
  }>(() => {
    const rows: Visit[] = waitingList.data?.rows ?? [];
    const p: BillingQueueItem[] = [];
    const i: BillingQueueItem[] = [];
    for (const visit of rows) {
      const inv = invoiceByVisitId.get(visit.id);
      const item: BillingQueueItem = { visit, invoice: inv };
      if (!inv || inv.status === "DRAFT") {
        p.push(item);
      } else {
        i.push(item);
      }
    }
    return { pending: p, invoiced: i };
  }, [waitingList.data, invoiceByVisitId]);

  return {
    pending,
    invoiced,
    isLoading: waitingList.isLoading || invoicesLoading,
  };
}
