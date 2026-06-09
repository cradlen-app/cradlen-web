"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/common/utils/utils";
import { Link } from "@/i18n/navigation";
import { useDashboardPath } from "@/hooks/useDashboardPath";

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

function formatDate(value: string): string {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

export function InvoiceSearchPage() {
  const t = useTranslations("financial");
  const dashboardPath = useDashboardPath();

  const [status, setStatus] = useState<InvoiceStatus | "">("");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  const { invoices, isLoading } = useInvoices(
    status ? { status } : undefined,
  );

  const filtered = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    if (!q) return invoices;
    return invoices.filter(
      (inv) =>
        inv.invoice_number.toLowerCase().includes(q) ||
        inv.patient_id.toLowerCase().includes(q),
    );
  }, [invoices, deferredSearch]);

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
              onChange={(e) => setStatus(e.target.value as InvoiceStatus | "")}
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
          {!isLoading && (
            <span className="ms-auto text-xs text-gray-400">
              {t("invoices.resultsCount", { count: filtered.length })}
            </span>
          )}
        </div>

        {/* Table */}
        {isLoading ? (
          <p className="py-10 text-center text-sm text-gray-400">
            {t("invoices.loading")}
          </p>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">
            {t("invoices.empty")}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-100">
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
                {filtered.map((inv) => (
                  <InvoiceRow
                    key={inv.id}
                    invoice={inv}
                    href={dashboardPath(`/financial/invoices/${inv.id}`)}
                  />
                ))}
              </tbody>
            </table>
          </div>
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
