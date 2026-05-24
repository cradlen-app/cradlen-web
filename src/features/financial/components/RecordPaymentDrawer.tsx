"use client";

import { useEffect } from "react";
import { Dialog } from "radix-ui";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/common/utils/utils";
import { Button } from "@/components/ui/button";
import { useRecordPayment } from "../hooks/useRecordPayment";

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

const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "CARD", label: "Card" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "INSURANCE", label: "Insurance" },
  { value: "OTHER", label: "Other" },
] as const;

export function RecordPaymentDrawer({
  open,
  onOpenChange,
  invoiceId,
  outstandingAmount,
  currency = "EGP",
  onSuccess,
}: Props) {
  const recordPayment = useRecordPayment();

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
              Record Payment
            </Dialog.Title>
            <Dialog.Close
              className="inline-flex size-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
              aria-label="Close"
            >
              <X className="size-5" aria-hidden="true" />
            </Dialog.Close>
          </div>

          {/* Body */}
          <form onSubmit={onSubmit} className="flex flex-1 flex-col overflow-y-auto">
            <div className="flex flex-1 flex-col gap-4 px-5 py-4">
              {/* Amount */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  Amount ({currency})
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
                  Payment Method
                </label>
                <Controller
                  control={control}
                  name="payment_method"
                  render={({ field }) => (
                    <div className="grid grid-cols-2 gap-2">
                      {PAYMENT_METHODS.map((m) => (
                        <button
                          key={m.value}
                          type="button"
                          onClick={() => field.onChange(m.value)}
                          className={cn(
                            "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                            field.value === m.value
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50",
                          )}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  )}
                />
              </div>

              {/* Payment date */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  Payment Date
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
                  Reference Number <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  {...register("reference_number")}
                  type="text"
                  placeholder="e.g. TXN-12345"
                  className={inputClass}
                />
              </div>

              {/* Notes */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  Notes <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  {...register("notes")}
                  rows={3}
                  placeholder="Any additional notes…"
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
                Cancel
              </Button>
              <Button type="submit" disabled={recordPayment.isPending}>
                {recordPayment.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Recording…
                  </>
                ) : (
                  "Record Payment"
                )}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
