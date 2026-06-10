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

  // `limit` must stay within the backend cap (Max 100) or the whole request
  // 400s and the panel shows "No invoice" for everyone. No `date_to`: the
  // `gte` lower bound alone returns today's invoices on any backend version
  // (the upper-bound handling isn't relied upon here). Poll so a charge the
  // doctor adds mid-visit (auto-appended to the invoice) surfaces without a
  // manual reload — the visits Socket.IO can't authenticate cross-origin.
  const { invoices, isLoading: invoicesLoading } = useInvoices(
    {
      branch_id: branchId ?? undefined,
      date_from: today,
      limit: 100,
    },
    { refetchInterval: 15000 },
  );

  const { invoiceByVisitId, invoiceByEpisodeId } = useMemo(() => {
    const byVisit = new Map<string, Invoice>();
    const byEpisode = new Map<string, Invoice>();
    for (const inv of invoices ?? []) {
      if (inv.visit_id) byVisit.set(inv.visit_id, inv);
      // One open invoice per case — key by episode so a later visit in the same
      // episode resolves the case invoice even though its visit_id differs.
      if (inv.episode_id && inv.status !== "VOID") {
        byEpisode.set(inv.episode_id, inv);
      }
    }
    return { invoiceByVisitId: byVisit, invoiceByEpisodeId: byEpisode };
  }, [invoices]);

  const { pending, invoiced } = useMemo<{
    pending: BillingQueueItem[];
    invoiced: BillingQueueItem[];
  }>(() => {
    const rows: Visit[] = waitingList.data?.rows ?? [];
    const p: BillingQueueItem[] = [];
    const i: BillingQueueItem[] = [];
    for (const visit of rows) {
      const inv =
        invoiceByVisitId.get(visit.id) ??
        (visit.episodeId ? invoiceByEpisodeId.get(visit.episodeId) : undefined);
      const item: BillingQueueItem = { visit, invoice: inv };
      if (!inv || inv.status === "DRAFT") {
        p.push(item);
      } else {
        i.push(item);
      }
    }
    return { pending: p, invoiced: i };
  }, [waitingList.data, invoiceByVisitId, invoiceByEpisodeId]);

  return {
    pending,
    invoiced,
    isLoading: waitingList.isLoading || invoicesLoading,
  };
}
