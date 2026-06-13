"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, ReceiptText, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Dialog } from "radix-ui";

import { cn } from "@/common/utils/utils";
import { Button } from "@/components/ui/button";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";

import { useInvoices } from "../hooks/useInvoices";
import { formatDate, formatMoney } from "../lib/format";
import type { Invoice, InvoiceStatus } from "../types/financial.types";
import { FinancialPageShell } from "./FinancialPageShell";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import { InvoiceStatCards } from "./InvoiceStatCards";
import { InvoiceDetailView } from "./InvoiceDetailView";
import { InvoiceDrawer } from "./InvoiceDrawer";

const STATUS_OPTIONS: InvoiceStatus[] = [
  "DRAFT",
  "ISSUED",
  "PARTIALLY_PAID",
  "PAID",
  "VOID",
  "REFUNDED",
];

const PAGE_SIZE = 10;

export function InvoiceSearchPage() {
  const t = useTranslations("financial");
  const branchId = useAuthContextStore((s) => s.branchId);
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<InvoiceStatus | "">("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  // Deep-link / preselect support (e.g. notifications link to `?invoice=<id>`).
  const [selectedId, setSelectedId] = useState<string | null>(
    () => searchParams?.get("invoice") ?? null,
  );
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [newInvoiceOpen, setNewInvoiceOpen] = useState(false);

  // Debounce the search box so each keystroke doesn't fire a request. Resetting
  // to page 1 happens here (not on every keystroke) once the value settles.
  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(id);
  }, [search]);

  const { invoices, total, totalPages, isLoading, isFetching, error } =
    useInvoices({
      // Scope to the active branch so branch-level staff (reception, accountant)
      // hit the backend's branch-access check instead of the owner-only
      // org-management check. Consistent with cash sessions + the billing queue.
      ...(branchId ? { branch_id: branchId } : {}),
      ...(status ? { status } : {}),
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      page,
      limit: PAGE_SIZE,
    });

  // Derive the active selection during render (no effect): a deliberate pick
  // wins, otherwise fall back to the first row so the panel is never empty.
  const effectiveSelectedId = selectedId ?? invoices[0]?.id ?? null;

  const resolvedTotalPages = totalPages ?? 1;
  const canPrev = page > 1;
  const canNext = page < resolvedTotalPages;

  function selectInvoice(id: string) {
    setSelectedId(id);
    setMobileDetailOpen(true);
  }

  return (
    <FinancialPageShell
      title={t("invoices.title")}
      subtitle={t("invoices.subtitle")}
      actions={
        <Button
          type="button"
          size="sm"
          className="rounded-full bg-brand-primary text-white hover:bg-brand-primary/90"
          onClick={() => setNewInvoiceOpen(true)}
        >
          <Plus className="size-4" aria-hidden="true" />
          {t("invoices.newInvoice")}
        </Button>
      }
    >
      <div className="flex flex-col gap-4 lg:gap-6">
        <InvoiceStatCards />

        <div className="grid gap-4 lg:grid-cols-[1fr_minmax(380px,440px)] lg:items-start lg:gap-6">
          {/* ── List ─────────────────────────────────────────────────── */}
          <div className="min-w-0 rounded-2xl border border-gray-100 bg-white shadow-sm">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 p-4">
              <div className="relative min-w-0 flex-1 sm:max-w-xs">
                <Search className="pointer-events-none absolute inset-s-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("invoices.searchPlaceholder")}
                  className="w-full rounded-lg border border-gray-200 bg-white py-2 ps-9 pe-3 text-sm outline-none focus:border-brand-primary"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-500">
                <span className="hidden sm:inline">{t("invoices.filterStatus")}</span>
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value as InvoiceStatus | "");
                    setPage(1);
                  }}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-primary"
                >
                  <option value="">{t("invoices.statusAll")}</option>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {t(`invoice.status.${s}`)}
                    </option>
                  ))}
                </select>
              </label>
              {!isLoading && total != null && (
                <span className="ms-auto text-xs text-gray-400">
                  {t("invoices.resultsCount", { count: total })}
                </span>
              )}
            </div>

            {/* Table */}
            {isLoading ? (
              <p className="py-10 text-center text-sm text-gray-400">
                {t("invoices.loading")}
              </p>
            ) : error ? (
              <p className="py-10 text-center text-sm text-red-500">
                {t("invoices.error")}
              </p>
            ) : invoices.length === 0 ? (
              <p className="py-10 text-center text-sm text-gray-400">
                {t("invoices.empty")}
              </p>
            ) : (
              <>
                <div
                  className={cn(
                    "overflow-x-auto transition-opacity",
                    isFetching && "opacity-60",
                  )}
                >
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-start text-xs uppercase tracking-wide text-gray-400">
                        <th className="px-4 py-3 text-start font-medium">
                          {t("invoices.columns.number")}
                        </th>
                        <th className="px-4 py-3 text-start font-medium">
                          {t("invoices.columns.patient")}
                        </th>
                        <th className="px-4 py-3 text-start font-medium">
                          {t("invoices.columns.date")}
                        </th>
                        <th className="px-4 py-3 text-end font-medium">
                          {t("invoices.columns.amount")}
                        </th>
                        <th className="px-4 py-3 text-start font-medium">
                          {t("invoices.columns.status")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((inv) => (
                        <InvoiceRow
                          key={inv.id}
                          invoice={inv}
                          selected={inv.id === effectiveSelectedId}
                          onSelect={() => selectInvoice(inv.id)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {resolvedTotalPages > 1 && (
                  <div className="flex items-center justify-between gap-3 border-t border-gray-100 p-4">
                    <span className="text-xs text-gray-400">
                      {t("invoices.pagination.pageOf", {
                        page,
                        totalPages: resolvedTotalPages,
                      })}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={!canPrev}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ChevronLeft className="size-4 rtl:rotate-180" />
                        {t("invoices.pagination.prev")}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setPage((p) => Math.min(resolvedTotalPages, p + 1))
                        }
                        disabled={!canNext}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {t("invoices.pagination.next")}
                        <ChevronRight className="size-4 rtl:rotate-180" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Detail panel (lg+) ───────────────────────────────────── */}
          <div className="hidden min-w-0 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm lg:sticky lg:top-4 lg:block lg:max-h-[calc(100vh-11rem)] lg:overflow-y-auto">
            {effectiveSelectedId ? (
              <InvoiceDetailView invoiceId={effectiveSelectedId} layout="panel" />
            ) : (
              <DetailEmptyState message={t("invoices.selectPrompt")} />
            )}
          </div>
        </div>
      </div>

      {/* Mobile detail drawer (<lg) */}
      <Dialog.Root open={mobileDetailOpen} onOpenChange={setMobileDetailOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px] lg:hidden" />
          <Dialog.Content
            className={cn(
              "fixed inset-y-0 end-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl outline-none lg:hidden",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
              "duration-200",
            )}
          >
            <div className="flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3">
              <Dialog.Title className="text-sm font-semibold text-brand-black">
                {t("invoices.title")}
              </Dialog.Title>
              <Dialog.Close
                className="inline-flex size-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-brand-black"
                aria-label={t("invoice.panel.closeAria")}
              >
                <X className="size-4" aria-hidden="true" />
              </Dialog.Close>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {selectedId && (
                <InvoiceDetailView invoiceId={selectedId} layout="panel" />
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Create-invoice drawer */}
      <InvoiceDrawer open={newInvoiceOpen} onOpenChange={setNewInvoiceOpen} />
    </FinancialPageShell>
  );
}

function DetailEmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-full min-h-64 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <ReceiptText className="size-10 text-gray-200" aria-hidden="true" />
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
}

function InvoiceRow({
  invoice,
  selected,
  onSelect,
}: {
  invoice: Invoice;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <tr
      onClick={onSelect}
      className={cn(
        "cursor-pointer border-b border-gray-50 transition-colors last:border-0",
        selected ? "bg-brand-primary/5" : "hover:bg-gray-50",
      )}
    >
      <td className="px-4 py-3">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className={cn(
            "font-medium",
            selected ? "text-brand-primary" : "text-brand-primary hover:underline",
          )}
        >
          {invoice.invoice_number}
        </button>
      </td>
      <td className="px-4 py-3 text-gray-600">
        {invoice.patient?.full_name ?? invoice.patient_id}
      </td>
      <td className="px-4 py-3 text-gray-500">{formatDate(invoice.created_at)}</td>
      <td className="px-4 py-3 text-end tabular-nums text-gray-700">
        {formatMoney(invoice.total_amount, invoice.currency)}
      </td>
      <td className="px-4 py-3">
        <InvoiceStatusBadge status={invoice.status} />
      </td>
    </tr>
  );
}
