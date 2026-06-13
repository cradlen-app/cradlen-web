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
  const waitingList = useUnifiedWaitingList({
    branchId,
    assignedToMe: false,
    page: 1,
    limit: 100,
  });

  // Fetch invoices for exactly the visits on screen, NOT by date: billing is
  // per-visit, so a visit's invoice is created at booking but a `date_from:
  // today` filter could still drop it at the local-vs-UTC midnight boundary.
  // Bounding to the waiting list's visit ids (≤100) keeps the result set small
  // and timing-independent, and each visit maps 1:1 to its own invoice.
  const visitIds = useMemo(() => {
    const ids = new Set<string>();
    for (const v of waitingList.data?.rows ?? []) {
      if (v.id) ids.add(v.id);
    }
    return [...ids];
  }, [waitingList.data]);

  // `limit` stays within the backend cap (Max 100). Poll so a charge the doctor
  // adds mid-visit (auto-appended to the invoice) surfaces without a manual
  // reload — the visits Socket.IO can't authenticate cross-origin.
  const { invoices, isLoading: invoicesLoading } = useInvoices(
    {
      branch_id: branchId ?? undefined,
      visit_ids: visitIds,
      limit: 100,
    },
    // No visits on screen → nothing to match; skip the fetch entirely rather
    // than letting an empty `visit_ids` widen the query to all branch invoices.
    { refetchInterval: 15000, enabled: visitIds.length > 0 },
  );

  const invoiceByVisitId = useMemo(() => {
    const byVisit = new Map<string, Invoice>();
    for (const inv of invoices ?? []) {
      if (inv.visit_id) byVisit.set(inv.visit_id, inv);
    }
    return byVisit;
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
