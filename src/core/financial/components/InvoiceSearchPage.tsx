"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/common/utils/utils";
import { Link, useRouter } from "@/i18n/navigation";
import { useDashboardPath } from "@/hooks/useDashboardPath";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";

import { useInvoices } from "../hooks/useInvoices";
import { formatMoney } from "../lib/format";
import type { Invoice, InvoiceStatus } from "../types/financial.types";
import { FinancialPageShell } from "./FinancialPageShell";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";

const STATUS_OPTIONS: InvoiceStatus[] = [
  "DRAFT",
  "ISSUED",
  "PARTIALLY_PAID",
  "PAID",
  "VOID",
  "REFUNDED",
];

const PAGE_SIZE = 10;

function formatDate(value: string): string {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

export function InvoiceSearchPage() {
  const t = useTranslations("financial");
  const dashboardPath = useDashboardPath();
  const router = useRouter();
  const branchId = useAuthContextStore((s) => s.branchId);

  // Deep-link from the "doctor added a service" notification: scope the list to
  // one clinical case so reception lands on that patient's case invoice.
  const searchParams = useSearchParams();
  const episodeId = searchParams.get("episode") ?? undefined;

  const [status, setStatus] = useState<InvoiceStatus | "">("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

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
      ...(episodeId ? { episode_id: episodeId } : {}),
      ...(status ? { status } : {}),
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      page,
      limit: PAGE_SIZE,
    });

  // When the episode deep-link resolves to exactly one invoice, jump straight to
  // it so reception can collect without an extra click. One-shot per episode.
  const autoOpenedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!episodeId || isLoading || isFetching) return;
    if (autoOpenedRef.current === episodeId) return;
    if (invoices.length === 1) {
      autoOpenedRef.current = episodeId;
      router.replace(
        dashboardPath(`/financial/invoices/${invoices[0]!.id}`) as Parameters<
          typeof router.replace
        >[0],
      );
    }
  }, [episodeId, isLoading, isFetching, invoices, router, dashboardPath]);

  const resolvedTotalPages = totalPages ?? 1;
  const canPrev = page > 1;
  const canNext = page < resolvedTotalPages;

  return (
    <FinancialPageShell title={t("invoices.title")} subtitle={t("invoices.subtitle")}>
      <div className="flex flex-col gap-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
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
                "overflow-x-auto rounded-xl border border-gray-100 transition-opacity",
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
                      {t("invoices.columns.status")}
                    </th>
                    <th className="px-4 py-3 text-end font-medium">
                      {t("invoices.columns.total")}
                    </th>
                    <th className="px-4 py-3 text-end font-medium">
                      {t("invoices.columns.paid")}
                    </th>
                    <th className="px-4 py-3 text-end font-medium">
                      {t("invoices.columns.balance")}
                    </th>
                    <th className="px-4 py-3 text-start font-medium">
                      {t("invoices.columns.date")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <InvoiceRow
                      key={inv.id}
                      invoice={inv}
                      href={dashboardPath(`/financial/invoices/${inv.id}`)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {resolvedTotalPages > 1 && (
              <div className="flex items-center justify-between gap-3">
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
    </FinancialPageShell>
  );
}

function InvoiceRow({ invoice, href }: { invoice: Invoice; href: string }) {
  const balance = invoice.total_amount - invoice.paid_amount;
  return (
    <tr className="border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50">
      <td className="px-4 py-3">
        <Link
          href={href as Parameters<typeof Link>[0]["href"]}
          className="font-medium text-brand-primary hover:underline"
        >
          {invoice.invoice_number}
        </Link>
      </td>
      <td className="px-4 py-3 text-gray-600">
        {invoice.patient?.full_name ?? invoice.patient_id}
      </td>
      <td className="px-4 py-3">
        <InvoiceStatusBadge status={invoice.status} />
      </td>
      <td className="px-4 py-3 text-end tabular-nums text-gray-700">
        {formatMoney(invoice.total_amount, invoice.currency)}
      </td>
      <td className="px-4 py-3 text-end tabular-nums text-gray-700">
        {formatMoney(invoice.paid_amount, invoice.currency)}
      </td>
      <td
        className={cn(
          "px-4 py-3 text-end tabular-nums",
          balance > 0 ? "text-amber-700" : "text-gray-400",
        )}
      >
        {formatMoney(balance, invoice.currency)}
      </td>
      <td className="px-4 py-3 text-gray-500">{formatDate(invoice.created_at)}</td>
    </tr>
  );
}
