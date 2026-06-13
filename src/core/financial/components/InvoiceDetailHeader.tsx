"use client";

import { Ban, Pencil, Send, CreditCard, FileText, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/common/utils/utils";
import { Button } from "@/components/ui/button";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import { formatMoney, formatDateLong as formatDate } from "../lib/format";
import type { InvoicePermissions } from "../lib/invoiceActions";
import type { Invoice } from "../types/financial.types";

type Props = {
  invoice: Invoice;
  permissions: InvoicePermissions;
  /** Whether the issue mutation is in flight (drives the button spinner). */
  issuing: boolean;
  /** Compact, single-surface layout for the narrow master-detail panel. */
  dense?: boolean;
  onVoid: () => void;
  onEdit: () => void;
  onIssue: () => void;
  onRecordPayment: () => void;
};

/** The invoice-detail header card: identity + balance + the action buttons. */
export function InvoiceDetailHeader({
  invoice,
  permissions,
  issuing,
  dense = false,
  onVoid,
  onEdit,
  onIssue,
  onRecordPayment,
}: Props) {
  const t = useTranslations("financial.invoice");
  const { canEdit, canIssue, canRecordPayment, canVoid, isPartiallyPaid } =
    permissions;
  const remaining = invoice.total_amount - invoice.paid_amount;

  return (
    <div
      className={cn(
        dense
          ? "min-w-0"
          : "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm",
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-4",
          !dense && "sm:flex-row sm:items-start sm:justify-between",
        )}
      >
        {/* Left: identity */}
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <FileText
                className={cn(
                  "shrink-0 text-gray-400",
                  dense ? "size-4" : "size-5",
                )}
                aria-hidden="true"
              />
              <h1
                className={cn(
                  "font-bold text-gray-900",
                  dense
                    ? "text-lg leading-snug break-words"
                    : "text-xl sm:text-2xl",
                )}
              >
                {invoice.invoice_number}
              </h1>
            </div>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
          <p className="text-sm text-gray-500">
            {t("view.createdOn", { date: formatDate(invoice.created_at) })}
          </p>
          {remaining > 0 && (
            <p
              className={cn(
                "text-sm font-medium",
                isPartiallyPaid ? "text-amber-600" : "text-gray-600",
              )}
            >
              {t("view.balanceDue", {
                amount: formatMoney(remaining, invoice.currency),
              })}
            </p>
          )}
        </div>

        {/* Right: action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {canVoid && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onVoid}
            >
              <Ban className="size-3.5" aria-hidden="true" />
              {t("actions.voidShort")}
            </Button>
          )}
          {canEdit && (
            <Button type="button" variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="size-3.5" aria-hidden="true" />
              {t("actions.edit")}
            </Button>
          )}
          {canIssue && (
            <Button
              type="button"
              size="sm"
              className="rounded-full bg-brand-primary text-white hover:bg-brand-primary/90"
              onClick={onIssue}
              disabled={issuing}
            >
              {issuing ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="size-3.5" aria-hidden="true" />
              )}
              {t("actions.issue")}
            </Button>
          )}
          {canRecordPayment && (
            <Button
              type="button"
              size="sm"
              className="rounded-full bg-brand-primary text-white hover:bg-brand-primary/90"
              onClick={onRecordPayment}
            >
              <CreditCard className="size-3.5" aria-hidden="true" />
              {t("actions.recordPayment")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
