"use client";

import { useEffect } from "react";
import { Dialog } from "radix-ui";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Loader2, Banknote } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/common/utils/utils";
import { Link } from "@/i18n/navigation";
import { useDashboardPath } from "@/hooks/useDashboardPath";
import { Button } from "@/components/ui/button";
import { useRecordPayment } from "../hooks/useRecordPayment";
import { useCurrentCashSession } from "../hooks/useCashSessions";

const schema = z.object({
  amount: z.number().positive("Amount must be positive"),
  payment_method: z.enum(["CASH", "CARD", "BANK_TRANSFER", "INSURANCE", "OTHER"]),
  payment_date: z.string().min(1, "Date is required"),
  reference_number: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  outstandingAmount: number;
  currency?: string;
  onSuccess?: () => void;
};

const PAYMENT_METHOD_VALUES = [
  "CASH",
  "CARD",
  "BANK_TRANSFER",
  "INSURANCE",
  "OTHER",
] as const;

export function RecordPaymentDrawer({
  open,
  onOpenChange,
  invoiceId,
  outstandingAmount,
  currency = "EGP",
  onSuccess,
}: Props) {
  const t = useTranslations("financial.payments");
  const tCommon = useTranslations("financial.common");
  const recordPayment = useRecordPayment();
  // Payments require an open cash session so the drawer reconciles; cash
  // payments are additionally attributed to that session.
  const { session: cashSession, isLoading: sessionLoading } =
    useCurrentCashSession();
  const sessionOpen = cashSession?.status === "OPEN";
  const cashSessionsHref = useDashboardPath()("/financial/cash-sessions");

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: outstandingAmount,
      payment_method: "CASH",
      payment_date: new Date().toISOString().split("T")[0],
      reference_number: "",
      notes: "",
    },
  });

  useEffect(() => {
    setValue("amount", outstandingAmount);
  }, [outstandingAmount, setValue]);

  function handleClose(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  const onSubmit = handleSubmit((data) => {
    if (!sessionOpen) return;
    recordPayment.mutate(
      {
        invoiceId,
        payload: {
          amount: data.amount,
          payment_method: data.payment_method,
          reference_number: data.reference_number || undefined,
          notes: data.notes || undefined,
          payment_date: new Date(data.payment_date + "T00:00:00").toISOString(),
        },
      },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
          onSuccess?.();
        },
      },
    );
  });

  const inputClass = cn(
    "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900",
    "placeholder:text-gray-400 outline-none transition-colors",
    "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
  );

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/35" />
        <Dialog.Content
          className={cn(
            "fixed inset-0 z-50 flex h-dvh flex-col bg-white shadow-2xl outline-none",
            "sm:inset-y-0 sm:start-auto sm:inset-e-0 sm:w-96 sm:max-w-[calc(100vw-2rem)]",
            "sm:ltr:rounded-l-2xl sm:rtl:rounded-r-2xl",
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <Dialog.Title className="text-base font-semibold text-gray-900">
              {t("recordTitle")}
            </Dialog.Title>
            <Dialog.Close
              className="inline-flex size-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
              aria-label={tCommon("close")}
            >
              <X className="size-5" aria-hidden="true" />
            </Dialog.Close>
          </div>

          {/* Body */}
          <form onSubmit={onSubmit} className="flex flex-1 flex-col overflow-y-auto">
            <div className="flex flex-1 flex-col gap-4 px-5 py-4">
              {/* No open cash session — block recording */}
              {!sessionLoading && !sessionOpen && (
                <div className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <div className="flex items-start gap-2">
                    <Banknote
                      className="mt-0.5 size-4 shrink-0 text-amber-600"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-sm font-medium text-amber-800">
                        {t("noSession.title")}
                      </p>
                      <p className="mt-0.5 text-xs text-amber-700">
                        {t("noSession.body")}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={cashSessionsHref}
                    onClick={() => onOpenChange(false)}
                    className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-700"
                  >
                    {t("noSession.action")}
                  </Link>
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  {t("fields.amountWithCurrency", { currency })}
                </label>
                <input
                  {...register("amount", { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  min="0.01"
                  className={cn(inputClass, errors.amount && "border-red-400")}
                />
                {errors.amount && (
                  <p className="mt-1 text-xs text-red-500">{errors.amount.message}</p>
                )}
              </div>

              {/* Payment method */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  {t("fields.paymentMethod")}
                </label>
                <Controller
                  control={control}
                  name="payment_method"
                  render={({ field }) => (
                    <div className="grid grid-cols-2 gap-2">
                      {PAYMENT_METHOD_VALUES.map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => field.onChange(value)}
                          className={cn(
                            "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                            field.value === value
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50",
                          )}
                        >
                          {t(`method.${value}`)}
                        </button>
                      ))}
                    </div>
                  )}
                />
              </div>

              {/* Payment date */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  {t("fields.paymentDate")}
                </label>
                <input
                  {...register("payment_date")}
                  type="date"
                  className={cn(inputClass, errors.payment_date && "border-red-400")}
                />
                {errors.payment_date && (
                  <p className="mt-1 text-xs text-red-500">{errors.payment_date.message}</p>
                )}
              </div>

              {/* Reference number */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  {t("fields.referenceNumber")} <span className="text-gray-400">{tCommon("optional")}</span>
                </label>
                <input
                  {...register("reference_number")}
                  type="text"
                  placeholder={t("fields.referenceNumberPlaceholder")}
                  className={inputClass}
                />
              </div>

              {/* Notes */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  {t("fields.notes")} <span className="text-gray-400">{tCommon("optional")}</span>
                </label>
                <textarea
                  {...register("notes")}
                  rows={3}
                  placeholder={t("fields.notesPlaceholder")}
                  className={cn(inputClass, "resize-none")}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose(false)}
                disabled={recordPayment.isPending}
              >
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={recordPayment.isPending || !sessionOpen}>
                {recordPayment.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    {t("recording")}
                  </>
                ) : (
                  t("actions.record")
                )}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
