"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog } from "radix-ui";
import { X, ReceiptText, FilePlus2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/common/utils/utils";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { useBillingQueue, type BillingQueueItem } from "../hooks/useBillingQueue";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import { InvoiceDrawer } from "./InvoiceDrawer";
import { CollectChargesDrawer } from "./CollectChargesDrawer";
import { formatMoney } from "../lib/format";
import type { Visit } from "@/features/visits/types/visits.types";

// ── Types ─────────────────────────────────────────────────────────────────────

type PanelItem = BillingQueueItem;

type DrawerState = {
  open: boolean;
  invoiceId?: string;
  prefill?: {
    patientId?: string;
    patientName?: string;
    visitId?: string;
    doctorId?: string;
    doctorName?: string;
  };
};

// ── Sub-components ────────────────────────────────────────────────────────────

function VisitRow({
  item,
  onClick,
  onCollect,
}: {
  item: PanelItem;
  onClick: () => void;
  onCollect?: () => void;
}) {
  const t = useTranslations("financial.invoice.panel");
  const tCollect = useTranslations("financial.collect");
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
    <div className="flex w-full items-start gap-1.5 rounded-lg px-1.5 transition-colors hover:bg-gray-50">
      <button
        type="button"
        onClick={onClick}
        className="flex flex-1 items-start gap-2.5 rounded-lg px-1.5 py-2.5 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30"
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
        <div className="flex shrink-0 flex-col items-end gap-0.5 mt-0.5">
          {invoice ? (
            <InvoiceStatusBadge status={invoice.status} />
          ) : (
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-gray-400">
              {t("noInvoice")}
            </span>
          )}
          {invoice && invoice.balance_due > 0 && invoice.status !== "DRAFT" && (
            <span className="text-[11px] font-semibold tabular-nums text-amber-600">
              {t("balanceDue", {
                amount: formatMoney(invoice.balance_due, invoice.currency),
              })}
            </span>
          )}
        </div>
      </button>
      {onCollect && (
        <button
          type="button"
          onClick={onCollect}
          aria-label={tCollect("collectAria")}
          title={tCollect("collectAria")}
          className="mt-1.5 inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-brand-primary/10 hover:text-brand-primary"
        >
          <FilePlus2 className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
      {title}
    </p>
  );
}

/** Loading placeholder mirroring the visit rows (name + time, status badge). */
function BillingQueueSkeleton() {
  return (
    <div>
      <div className="mb-1 px-3">
        <div className="h-2.5 w-24 animate-pulse rounded bg-gray-100" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-start gap-2.5 px-3 py-2.5">
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-32 animate-pulse rounded bg-gray-100" />
            <div className="h-2.5 w-16 animate-pulse rounded bg-gray-100" />
          </div>
          <div className="mt-0.5 h-5 w-16 animate-pulse rounded-full bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export type InvoicePanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * When set (e.g. from a "service added" notification deep-link), auto-open the
   * invoice drawer for the matching visit once the billing queue has loaded.
   */
  autoOpenVisitId?: string;
};

export function InvoicePanel({
  open,
  onOpenChange,
  autoOpenVisitId,
}: InvoicePanelProps) {
  const t = useTranslations("financial.invoice.panel");
  const branchId = useAuthContextStore((s) => s.branchId);

  const { pending, invoiced, isLoading } = useBillingQueue(branchId);
  const totalCount = pending.length + invoiced.length;

  const [drawerState, setDrawerState] = useState<DrawerState>({ open: false });
  const [collectVisit, setCollectVisit] = useState<Visit | null>(null);

  function openDrawerForItem(item: PanelItem) {
    const { visit, invoice } = item;
    setDrawerState({
      open: true,
      invoiceId: invoice?.id,
      prefill: {
        patientId: visit.patient.id,
        patientName: visit.patient.fullName,
        visitId: visit.id,
        doctorId: visit.assignedDoctorId,
        doctorName: visit.assignedDoctorName,
      },
    });
  }

  // Deep-link: open the drawer for the notified visit once it appears in the
  // queue. The ref guards against reopening after the user closes the drawer.
  const consumedAutoOpenRef = useRef<string | null>(null);
  useEffect(() => {
    if (!autoOpenVisitId || consumedAutoOpenRef.current === autoOpenVisitId) {
      return;
    }
    const item = [...pending, ...invoiced].find(
      (i) => i.visit.id === autoOpenVisitId,
    );
    if (item) {
      consumedAutoOpenRef.current = autoOpenVisitId;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- opening the drawer is a one-shot sync from the async billing queue, guarded by the consumed ref
      openDrawerForItem(item);
    }
  }, [autoOpenVisitId, pending, invoiced]);

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
                {t("todaysBilling")}
              </Dialog.Title>
              <Dialog.Close
                className={cn(
                  "inline-flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors",
                  "hover:bg-gray-100 hover:text-brand-black",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30",
                )}
                aria-label={t("closeAria")}
              >
                <X className="size-4" aria-hidden="true" />
              </Dialog.Close>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto py-3">
              {isLoading ? (
                <BillingQueueSkeleton />
              ) : totalCount === 0 ? (
                <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
                  <ReceiptText className="size-8 text-gray-200" aria-hidden="true" />
                  <p className="text-xs text-gray-400">{t("noVisits")}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pending.length > 0 && (
                    <div>
                      <SectionHeader
                        title={t("pendingBilling", { count: pending.length })}
                      />
                      <div>
                        {pending.map((item) => (
                          <VisitRow
                            key={item.visit.id}
                            item={item}
                            onClick={() => openDrawerForItem(item)}
                            onCollect={
                              item.invoice
                                ? undefined
                                : () => setCollectVisit(item.visit)
                            }
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {invoiced.length > 0 && (
                    <div>
                      <SectionHeader
                        title={t("invoiced", { count: invoiced.length })}
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
            {totalCount > 0 && !isLoading && (
              <div className="border-t border-gray-100 px-4 py-2.5">
                <p className="text-[11px] text-gray-400">
                  {t.rich("summary", {
                    pending: () => (
                      <span className="font-medium text-red-500">
                        {pending.length}
                      </span>
                    ),
                    invoiced: () => (
                      <span className="font-medium text-emerald-600">
                        {invoiced.length}
                      </span>
                    ),
                  })}
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

      {/* Collect-from-charges flow for a pending visit */}
      {collectVisit && branchId && (
        <CollectChargesDrawer
          open={!!collectVisit}
          onOpenChange={(isOpen) => !isOpen && setCollectVisit(null)}
          branchId={branchId}
          patientId={collectVisit.patient.id}
          visitId={collectVisit.id}
          onBuilt={(invoiceId) => {
            setCollectVisit(null);
            setDrawerState({ open: true, invoiceId });
          }}
        />
      )}
    </>
  );
}
