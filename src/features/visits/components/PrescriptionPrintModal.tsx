"use client";

import { Dialog } from "radix-ui";
import { CheckCircle2, Loader2, Printer, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

import { usePrescriptionPrint } from "../hooks/usePrescriptionPrint";
import { PrescriptionDocument } from "./prescription/PrescriptionDocument";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visitId: string | null;
  /** Patient name for the confirmation line; the document carries its own copy. */
  patientName?: string;
};

export function PrescriptionPrintModal({
  open,
  onOpenChange,
  visitId,
  patientName,
}: Props) {
  const t = useTranslations("visits.prescription");
  const { print, isLoading, isNotFound, error, isFetching, refetch } =
    usePrescriptionPrint(open ? visitId ?? undefined : undefined);

  const canPrint = !!print && !isNotFound && !error;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/35 print:hidden" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-51 flex max-h-[90vh] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl bg-white shadow-2xl outline-none print:static print:max-h-none print:w-full print:translate-x-0 print:translate-y-0 print:rounded-none print:shadow-none">
          {/* Confirmation + actions — hidden when printing. */}
          <div className="flex items-start justify-between gap-3 border-b border-gray-100 p-4 print:hidden">
            <div className="flex items-start gap-2">
              <CheckCircle2
                className="mt-0.5 size-5 shrink-0 text-brand-primary"
                aria-hidden="true"
              />
              <div>
                <Dialog.Title className="text-base font-medium text-gray-900">
                  {t("title")}
                </Dialog.Title>
                <Dialog.Description className="text-xs text-gray-500">
                  {patientName
                    ? t("sentTo", { patient: patientName })
                    : t("sentGeneric")}
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close className="rounded-lg p-1 text-gray-400 hover:bg-gray-50">
              <X className="size-5" aria-hidden="true" />
            </Dialog.Close>
          </div>

          <div
            id="prescription-printable"
            className="min-h-0 flex-1 overflow-y-auto p-6"
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-sm text-gray-400">
                <Loader2 className="me-2 size-4 animate-spin" aria-hidden="true" />
                {t("loading")}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <p className="text-sm text-red-500">{t("error")}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void refetch()}
                  disabled={isFetching}
                >
                  {isFetching ? (
                    <Loader2
                      className="size-3.5 animate-spin"
                      aria-hidden="true"
                    />
                  ) : null}
                  {t("retry")}
                </Button>
              </div>
            ) : isNotFound || !print ? (
              <div className="py-10 text-center text-sm text-gray-400">
                {t("empty")}
              </div>
            ) : (
              <PrescriptionDocument
                template={print.template}
                document={print.document}
              />
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-100 p-4 print:hidden">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("close")}
            </Button>
            {canPrint ? (
              <Button type="button" onClick={() => window.print()}>
                <Printer className="size-3.5" aria-hidden="true" />
                {t("print")}
              </Button>
            ) : null}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
