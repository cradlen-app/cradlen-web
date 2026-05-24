"use client";

import { useState, useMemo } from "react";
import { Dialog } from "radix-ui";
import { X, Loader2, ReceiptText } from "lucide-react";
import { cn } from "@/common/utils/utils";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { useUnifiedWaitingList } from "@/features/visits/hooks/useUnifiedWaitingList";
import { useInvoices } from "../hooks/useInvoices";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import { InvoiceDrawer } from "./InvoiceDrawer";
import type { Visit } from "@/features/visits/types/visits.types";
import type { Invoice } from "../types/financial.types";

// ── Types ─────────────────────────────────────────────────────────────────────

type PanelItem = {
  visit: Visit;
  invoice: Invoice | undefined;
};

type DrawerState = {
  open: boolean;
  invoiceId?: string;
  prefill?: {
    patientId?: string;
    visitId?: string;
    doctorId?: string;
  };
};

// ── Sub-components ────────────────────────────────────────────────────────────

function VisitRow({
  item,
  onClick,
}: {
  item: PanelItem;
  onClick: () => void;
}) {
  const { visit, invoice } = item;

  const timeLabel = visit.scheduledAt
    ? new Date(visit.scheduledAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : visit.createdAt
      ? new Date(visit.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-2.5 rounded-lg px-3 py-2.5 text-start transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30"
    >
      <div className="flex-1 min-w-0">
        <p className="truncate text-xs font-medium text-brand-black">
          {visit.patient.fullName}
        </p>
        {timeLabel && (
          <p className="mt-0.5 text-[11px] text-gray-400 tabular-nums">
            {timeLabel}
          </p>
        )}
      </div>
      <div className="shrink-0 mt-0.5">
        {invoice ? (
          <InvoiceStatusBadge status={invoice.status} />
        ) : (
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-gray-400">
            No invoice
          </span>
        )}
      </div>
    </button>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
      {title}
    </p>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export type InvoicePanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function InvoicePanel({ open, onOpenChange }: InvoicePanelProps) {
  const branchId = useAuthContextStore((s) => s.branchId);

  const today = new Date().toISOString().split("T")[0]!;

  const waitingList = useUnifiedWaitingList({
    branchId,
    assignedToMe: false,
    page: 1,
    limit: 100,
  });

  const { invoices, isLoading: invoicesLoading } = useInvoices({
    branchId: branchId ?? undefined,
    dateFrom: today,
    dateTo: today,
    limit: 200,
  });

  const [drawerState, setDrawerState] = useState<DrawerState>({ open: false });

  // Build invoice lookup keyed by visit_id
  const invoiceByVisitId = useMemo<Map<string, Invoice>>(() => {
    const map = new Map<string, Invoice>();
    for (const inv of invoices ?? []) {
      if (inv.visit_id) map.set(inv.visit_id, inv);
    }
    return map;
  }, [invoices]);

  const waitingRows = waitingList.data?.rows;

  const { visits, pending, invoiced } = useMemo<{
    visits: Visit[];
    pending: PanelItem[];
    invoiced: PanelItem[];
  }>(() => {
    const rows: Visit[] = waitingRows ?? [];
    const p: PanelItem[] = [];
    const i: PanelItem[] = [];
    for (const visit of rows) {
      const inv = invoiceByVisitId.get(visit.id);
      const item: PanelItem = { visit, invoice: inv };
      if (!inv || inv.status === "DRAFT") {
        p.push(item);
      } else {
        i.push(item);
      }
    }
    return { visits: rows, pending: p, invoiced: i };
  }, [waitingRows, invoiceByVisitId]);

  function openDrawerForItem(item: PanelItem) {
    const { visit, invoice } = item;
    setDrawerState({
      open: true,
      invoiceId: invoice?.id,
      prefill: {
        patientId: visit.patient.id,
        visitId: visit.id,
        doctorId: visit.assignedDoctorId,
      },
    });
  }

  const isLoading = waitingList.isLoading && invoicesLoading;

  return (
    <>
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]" />
          <Dialog.Content
            className={cn(
              "fixed inset-y-0 end-0 z-50 flex w-full flex-col bg-white shadow-2xl outline-none",
              "sm:w-80",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
              "duration-200",
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <Dialog.Title className="text-sm font-semibold text-brand-black">
                Today&apos;s Billing
              </Dialog.Title>
              <Dialog.Close
                className={cn(
                  "inline-flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors",
                  "hover:bg-gray-100 hover:text-brand-black",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30",
                )}
                aria-label="Close billing panel"
              >
                <X className="size-4" aria-hidden="true" />
              </Dialog.Close>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto py-3">
              {isLoading ? (
                <div className="flex items-center justify-center py-12 text-gray-400">
                  <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                </div>
              ) : visits.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
                  <ReceiptText className="size-8 text-gray-200" aria-hidden="true" />
                  <p className="text-xs text-gray-400">No visits today</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pending.length > 0 && (
                    <div>
                      <SectionHeader
                        title={`Pending Billing (${pending.length})`}
                      />
                      <div>
                        {pending.map((item) => (
                          <VisitRow
                            key={item.visit.id}
                            item={item}
                            onClick={() => openDrawerForItem(item)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {invoiced.length > 0 && (
                    <div>
                      <SectionHeader
                        title={`Invoiced (${invoiced.length})`}
                      />
                      <div>
                        {invoiced.map((item) => (
                          <VisitRow
                            key={item.visit.id}
                            item={item}
                            onClick={() => openDrawerForItem(item)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer summary */}
            {visits.length > 0 && !isLoading && (
              <div className="border-t border-gray-100 px-4 py-2.5">
                <p className="text-[11px] text-gray-400">
                  <span className="font-medium text-red-500">
                    {pending.length}
                  </span>{" "}
                  pending ·{" "}
                  <span className="font-medium text-emerald-600">
                    {invoiced.length}
                  </span>{" "}
                  invoiced
                </p>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Drawer for create/view — floats above the panel */}
      <InvoiceDrawer
        open={drawerState.open}
        onOpenChange={(isOpen) =>
          setDrawerState((prev) => ({ ...prev, open: isOpen }))
        }
        invoiceId={drawerState.invoiceId}
        prefill={drawerState.prefill}
      />
    </>
  );
}
