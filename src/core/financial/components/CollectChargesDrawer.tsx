"use client";

import { Dialog } from "radix-ui";
import { Loader2, ReceiptText, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

import { useVisitCharges } from "../hooks/useCharges";
import { useBuildInvoiceFromCharges } from "../hooks/useBuildInvoiceFromCharges";
import { formatMoney } from "../lib/format";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
  patientId: string;
  visitId: string;
  /** Called with the new invoice id after a successful build. */
  onBuilt: (invoiceId: string) => void;
};

/**
 * Reception collect flow: lists a visit's open (PENDING) charges captured by
 * the doctor and builds a draft invoice from them in one step.
 */
export function CollectChargesDrawer({
  open,
  onOpenChange,
  branchId,
  patientId,
  visitId,
  onBuilt,
}: Props) {
  const t = useTranslations("financial.collect");
  const { charges, isLoading } = useVisitCharges(open ? visitId : undefined);
  const build = useBuildInvoiceFromCharges();

  const pending = charges.filter((c) => c.status === "PENDING");
  const total = pending.reduce(
    (sum, c) => sum + Number(c.unit_price) * c.quantity,
    0,
  );
  const currency = pending[0]?.currency;

  function handleBuild() {
    if (pending.length === 0) return;
    build.mutate(
      {
        branch_id: branchId,
        patient_id: patientId,
        visit_id: visitId,
        charge_ids: pending.map((c) => c.id),
      },
      {
        onSuccess: (res) => {
          onOpenChange(false);
          onBuilt(res.data.id);
        },
      },
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/35" />
        <Dialog.Content className="fixed inset-y-0 inset-e-0 z-[60] flex w-full max-w-md flex-col bg-white shadow-2xl outline-none">
          <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-5">
            <div className="min-w-0">
              <Dialog.Title className="text-lg font-medium text-gray-900">
                {t("title")}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-gray-400">
                {t("subtitle")}
              </Dialog.Description>
            </div>
            <Dialog.Close className="rounded-lg p-1 text-gray-400 hover:bg-gray-50">
              <X className="size-5" aria-hidden="true" />
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            <h3 className="mb-2 text-sm font-medium text-gray-700">
              {t("pendingCharges")}
            </h3>
            {isLoading ? (
              <div className="flex items-center justify-center py-10 text-sm text-gray-400">
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                {t("loading")}
              </div>
            ) : pending.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <ReceiptText className="size-8 text-gray-200" aria-hidden="true" />
                <p className="text-sm text-gray-400">{t("noCharges")}</p>
              </div>
            ) : (
              <ul className="space-y-1.5">
                {pending.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center gap-2 rounded-lg border border-gray-100 px-3 py-2 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-gray-800">
                        {c.description}
                      </p>
                      <p className="text-xs text-gray-400">
                        {c.quantity} ×{" "}
                        {formatMoney(Number(c.unit_price), c.currency)}
                      </p>
                    </div>
                    <span className="tabular-nums text-gray-700">
                      {formatMoney(Number(c.unit_price) * c.quantity, c.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-gray-100 p-5">
            <div className="text-sm">
              <span className="text-gray-500">{t("total")}: </span>
              <span className="font-semibold text-gray-900">
                {formatMoney(total, currency)}
              </span>
            </div>
            <Button
              type="button"
              onClick={handleBuild}
              disabled={pending.length === 0 || build.isPending}
            >
              {build.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  {t("building")}
                </>
              ) : (
                t("build")
              )}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
