"use client";

import { Dialog } from "radix-ui";
import { Printer, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { InvoicePreview } from "./InvoicePreview";
import { personName } from "../lib/format";
import type { Invoice } from "../types/financial.types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice;
  /** Display names when the response embeds them; fall back to ids. */
  patientName?: string;
  doctorName?: string;
};

export function InvoicePrintModal({
  open,
  onOpenChange,
  invoice,
  patientName,
  doctorName,
}: Props) {
  const tPrint = useTranslations("financial.invoice.print");
  const tCommon = useTranslations("financial.common");

  const resolvedDoctor =
    doctorName ??
    (invoice.assigned_doctor_id
      ? personName(invoice.doctor, invoice.assigned_doctor_id)
      : undefined);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/35 print:hidden" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-51 flex max-h-[88vh] w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl bg-white shadow-2xl outline-none print:static print:translate-x-0 print:translate-y-0 print:max-h-none print:w-full print:rounded-none print:shadow-none">
          {/* Chrome */}
          <div className="flex items-center justify-between border-b border-gray-100 p-4 print:hidden">
            <Dialog.Title className="text-base font-medium text-gray-900">
              {tPrint("title")} {invoice.invoice_number}
            </Dialog.Title>
            <div className="flex items-center gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => window.print()}>
                <Printer className="size-3.5" aria-hidden="true" />
                {tPrint("print")}
              </Button>
              <Dialog.Close className="rounded-lg p-1 text-gray-400 hover:bg-gray-50">
                <X className="size-5" aria-hidden="true" />
              </Dialog.Close>
            </div>
          </div>

          {/* Printable */}
          <div id="invoice-printable" className="overflow-y-auto p-8">
            <InvoicePreview
              invoiceNumber={invoice.invoice_number}
              status={invoice.status}
              patientName={
                patientName ?? personName(invoice.patient, invoice.patient_id)
              }
              doctorName={resolvedDoctor}
              issueDate={invoice.issued_at ?? invoice.created_at}
              dueDate={invoice.due_date}
              currency={invoice.currency}
              items={invoice.items}
              discountType={invoice.discount_type ?? "NONE"}
              discountValue={invoice.discount_value ?? 0}
              taxAmount={invoice.tax_amount}
              paidAmount={invoice.paid_amount}
              balanceDue={invoice.balance_due}
              notes={invoice.notes}
            />
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
