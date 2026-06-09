"use client";

import { useState } from "react";
import { Dialog } from "radix-ui";
import { Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/common/utils/utils";
import { Button } from "@/components/ui/button";

import { useCreateRefund } from "../hooks/useRefunds";
import { formatMoney } from "../lib/format";
import type { Payment } from "../types/financial.types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  payment: Payment | null;
};

const inputClass = cn(
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900",
  "placeholder:text-gray-400 outline-none transition-colors",
  "focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20",
);

export function RefundDrawer({ open, onOpenChange, invoiceId, payment }: Props) {
  const t = useTranslations("financial.refund");
  const tCommon = useTranslations("financial.common");
  const createRefund = useCreateRefund(invoiceId);

  const max = payment?.amount ?? 0;
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setAmount("");
    setReason("");
    setError(null);
  }

  function handleSubmit() {
    if (!payment) return;
    if (reason.trim().length < 4) {
      setError(t("reasonTooShort"));
      return;
    }
    const value = amount.trim() === "" ? max : Number(amount);
    createRefund.mutate(
      { payment_id: payment.id, amount: value, reason: reason.trim() },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
      },
    );
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/35" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-51 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-5 shadow-2xl outline-none">
          <div className="flex items-start justify-between gap-4">
            <div>
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

          <label className="mt-4 mb-1.5 block text-xs font-medium text-gray-700">
            {t("amountLabel")}{" "}
            <span className="text-gray-400">
              {t("max", { amount: formatMoney(max, payment?.currency) })}
            </span>
          </label>
          <input
            type="number"
            min={0.01}
            max={max}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={formatMoney(max, payment?.currency)}
            className={inputClass}
          />

          <label className="mt-3 mb-1.5 block text-xs font-medium text-gray-700">
            {t("reasonLabel")}
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder={t("reasonPlaceholder")}
            className={cn(inputClass, "resize-none")}
          />
          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

          <div className="mt-5 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleSubmit}
              disabled={createRefund.isPending}
            >
              {createRefund.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  {t("refunding")}
                </>
              ) : (
                t("confirm")
              )}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
