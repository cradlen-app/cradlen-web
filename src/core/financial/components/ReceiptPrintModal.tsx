"use client";

import { Dialog } from "radix-ui";
import { Loader2, Printer, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

import { useReceiptPrint } from "../hooks/useReceipts";
import { formatMoney } from "../lib/format";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiptId: string | null;
};

function dateTime(value: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

export function ReceiptPrintModal({ open, onOpenChange, receiptId }: Props) {
  const t = useTranslations("financial.receipt");
  const tCommon = useTranslations("financial.common");
  const tMethod = useTranslations("financial.payments.method");
  const { receipt, isLoading } = useReceiptPrint(open ? receiptId ?? undefined : undefined);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/35 print:hidden" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-51 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-2xl outline-none">
          <div className="flex items-center justify-between border-b border-gray-100 p-4 print:hidden">
            <Dialog.Title className="text-base font-medium text-gray-900">
              {t("title")}
            </Dialog.Title>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => window.print()}
                disabled={!receipt}
              >
                <Printer className="size-3.5" aria-hidden="true" />
                {t("print")}
              </Button>
              <Dialog.Close className="rounded-lg p-1 text-gray-400 hover:bg-gray-50">
                <X className="size-5" aria-hidden="true" />
              </Dialog.Close>
            </div>
          </div>

          <div id="receipt-printable" className="max-h-[70vh] overflow-y-auto p-6">
            {isLoading || !receipt ? (
              <div className="flex items-center justify-center py-12 text-sm text-gray-400">
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                {t("loading")}
              </div>
            ) : (
              <div className="space-y-4 text-sm">
                {/* Org header */}
                <div className="text-center">
                  <h2 className="text-lg font-semibold text-brand-black">
                    {receipt.organization.name}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {receipt.branch.name} · {receipt.branch.city},{" "}
                    {receipt.branch.governorate}
                  </p>
                  <p className="text-xs text-gray-400">{receipt.branch.address}</p>
                </div>

                <div className="border-t border-dashed border-gray-200" />

                <Row label={t("receiptNumber")} value={receipt.receipt_number} mono />
                <Row label={t("issuedAt")} value={dateTime(receipt.issued_at)} />
                <Row label={t("issuedBy")} value={receipt.issued_by.name} />

                <div className="border-t border-dashed border-gray-200" />

                <Row label={t("patient")} value={receipt.patient.full_name} />
                <Row
                  label={t("invoice")}
                  value={receipt.invoice.invoice_number}
                  mono
                />
                <Row
                  label={t("paymentMethod")}
                  value={tMethod(receipt.payment.payment_method)}
                />

                <div className="border-t border-dashed border-gray-200" />

                <Row
                  label={t("amount")}
                  value={formatMoney(
                    Number(receipt.payment.amount),
                    receipt.currency,
                  )}
                  emphasis
                />
                <Row
                  label={t("balanceAfter")}
                  value={formatMoney(Number(receipt.balance_after), receipt.currency)}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end border-t border-gray-100 p-4 print:hidden">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tCommon("close")}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Row({
  label,
  value,
  mono,
  emphasis,
}: {
  label: string;
  value: string;
  mono?: boolean;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-gray-500">{label}</span>
      <span
        className={[
          mono ? "font-mono text-xs" : "",
          emphasis ? "text-base font-semibold text-gray-900" : "text-gray-700",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}
