"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useInvoice } from "../hooks/useInvoice";
import { InvoiceDetailView } from "./InvoiceDetailView";

// ── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  invoiceId: string;
};

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Standalone full-page invoice detail (the `/financial/invoices/[invoiceId]`
 * route). Adds the page chrome + breadcrumb around the shared
 * {@link InvoiceDetailView}, which is also rendered inline in the invoices
 * master-detail panel.
 */
export function InvoiceDetailPage({ invoiceId }: Props) {
  const t = useTranslations("financial.invoice");
  const tCommon = useTranslations("financial.common");
  const params = useParams<{ locale: string; orgId: string; branchId: string }>();
  const locale = params?.locale ?? "";
  const orgId = params?.orgId ?? "";
  const branchId = params?.branchId ?? "";

  // Lightweight read for the breadcrumb label; shares the cache with the view.
  const { invoice } = useInvoice(invoiceId);

  const invoicesHref = `/${locale}/${orgId}/${branchId}/dashboard/financial/invoices`;

  return (
    <div className="min-h-full bg-gray-50/50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-gray-500">
          <Link href={invoicesHref} className="transition-colors hover:text-gray-900">
            {t("view.breadcrumbInvoices")}
          </Link>
          <ChevronRight className="size-4 shrink-0 text-gray-400" aria-hidden="true" />
          <span className="font-medium text-gray-900">
            {invoice ? invoice.invoice_number : tCommon("loading")}
          </span>
        </nav>

        <InvoiceDetailView invoiceId={invoiceId} />
      </div>
    </div>
  );
}
