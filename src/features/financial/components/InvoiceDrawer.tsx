"use client";

import { useState, useEffect } from "react";
import { Dialog } from "radix-ui";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Loader2, FileText, CreditCard, Ban, Send, Pencil } from "lucide-react";
import { cn } from "@/common/utils/utils";
import { Button } from "@/components/ui/button";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { useInvoice } from "../hooks/useInvoice";
import { useCreateInvoice } from "../hooks/useCreateInvoice";
import { useUpdateInvoice } from "../hooks/useUpdateInvoice";
import { useIssueInvoice } from "../hooks/useIssueInvoice";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import { InvoiceTotalsPanel } from "./InvoiceTotalsPanel";
import { InvoiceLineItemsEditor } from "./InvoiceLineItemsEditor";
import { RecordPaymentDrawer } from "./RecordPaymentDrawer";
import { VoidInvoiceDialog } from "./VoidInvoiceDialog";

// ── Schema ────────────────────────────────────────────────────────────────────

export const invoiceFormSchema = z.object({
  patient_id: z.string().min(1, "Patient is required"),
  visit_id: z.string().optional(),
  invoice_type: z.enum(["STANDARD", "FOLLOWUP", "PROFORMA", "INSURANCE", "REFUND"]),
  due_date: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      service_id: z.string().optional(),
      description: z.string().min(1, "Description is required"),
      quantity: z.number().int().positive(),
      unit_price: z.number().nonnegative(),
      discount_amount: z.number().nonnegative().optional(),
      pricing_source: z.enum(["PROVIDER_OVERRIDE", "BRANCH_OVERRIDE", "ORG_PRICE_LIST", "CUSTOM"]).optional(),
    }),
  ),
});

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

// ── Props ─────────────────────────────────────────────────────────────────────

type InvoiceDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId?: string;
  prefill?: {
    patientId?: string;
    visitId?: string;
  };
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const inputClass = cn(
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900",
  "placeholder:text-gray-400 outline-none transition-colors",
  "focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20",
);

// ── Component ─────────────────────────────────────────────────────────────────

export function InvoiceDrawer({
  open,
  onOpenChange,
  invoiceId,
  prefill,
}: InvoiceDrawerProps) {
  const orgId = useAuthContextStore((s) => s.organizationId) ?? "";
  const branchId = useAuthContextStore((s) => s.branchId) ?? "";
  const profileId = useAuthContextStore((s) => s.profileId) ?? undefined;

  const [editMode, setEditMode] = useState(!invoiceId);
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);

  // Data
  const { invoice, isLoading } = useInvoice(invoiceId);

  // Mutations
  const createMutation = useCreateInvoice();
  const updateMutation = useUpdateInvoice();
  const issueMutation = useIssueInvoice();

  const isCreate = !invoiceId;
  const isDraft = invoice?.status === "DRAFT" || isCreate;
  const canEdit = isCreate || invoice?.status === "DRAFT";
  const canIssue = invoice?.status === "DRAFT";
  const canRecordPayment =
    invoice?.status === "ISSUED" || invoice?.status === "PARTIALLY_PAID";
  const canVoid = invoice?.status === "DRAFT";

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      patient_id: prefill?.patientId ?? "",
      visit_id: prefill?.visitId ?? "",
      invoice_type: "STANDARD",
      due_date: "",
      notes: "",
      items: [],
    },
  });

  useEffect(() => {
    if (invoice && editMode) {
      form.reset({
        patient_id: invoice.patient_id ?? "",
        visit_id: invoice.visit_id ?? "",
        invoice_type: invoice.invoice_type,
        due_date: invoice.due_date ?? "",
        notes: invoice.notes ?? "",
        items: invoice.items.map((i) => ({
          service_id: i.service_id,
          description: i.service_name ?? "",
          quantity: i.quantity,
          unit_price: i.unit_price,
          discount_amount: i.discount ?? undefined,
          pricing_source: i.pricing_source,
        })),
      });
    }
  }, [invoice?.id, editMode, form, invoice]);

  const watchedItems = useWatch({ control: form.control, name: "items" });

  function handleClose() {
    form.reset();
    setEditMode(!invoiceId);
    onOpenChange(false);
  }

  const onSubmit = form.handleSubmit((data) => {
    if (isCreate) {
      createMutation.mutate(
        {
          branch_id: branchId,
          patient_id: data.patient_id || undefined,
          visit_id: data.visit_id || undefined,
          invoice_type: data.invoice_type,
          due_date: data.due_date || undefined,
          notes: data.notes || undefined,
          items: data.items.map((item) => ({
            service_id: item.service_id || undefined,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount: item.discount_amount,
          })),
        },
        {
          onSuccess: () => {
            form.reset();
            onOpenChange(false);
          },
        },
      );
    } else {
      updateMutation.mutate(
        {
          id: invoiceId!,
          payload: {
            invoice_type: data.invoice_type,
            due_date: data.due_date || undefined,
            notes: data.notes || undefined,
            items: data.items.map((item) => ({
              service_id: item.service_id,
              quantity: item.quantity,
              unit_price: item.unit_price,
              discount: item.discount_amount,
            })),
          },
        },
        {
          onSuccess: () => setEditMode(false),
        },
      );
    }
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <Dialog.Root open={open} onOpenChange={(next) => !next && handleClose()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/35" />
          <Dialog.Content
            className={cn(
              "fixed inset-0 z-50 flex h-dvh flex-col bg-white shadow-2xl outline-none",
              "sm:inset-y-0 sm:start-auto sm:inset-e-0 sm:w-[80vw] sm:max-w-4xl",
              "sm:ltr:rounded-l-2xl sm:rtl:rounded-r-2xl",
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <FileText className="size-5 text-gray-400" aria-hidden="true" />
                <Dialog.Title className="text-base font-semibold text-gray-900">
                  {isCreate ? "New Invoice" : `Invoice #${invoice?.invoice_number ?? "…"}`}
                </Dialog.Title>
                {invoice && <InvoiceStatusBadge status={invoice.status} />}
              </div>
              <Dialog.Close
                className="inline-flex size-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100"
                aria-label="Close"
                onClick={handleClose}
              >
                <X className="size-5" aria-hidden="true" />
              </Dialog.Close>
            </div>

            {/* Loading skeleton */}
            {isLoading && (
              <div className="flex flex-1 flex-col gap-4 p-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-10 animate-pulse rounded-lg bg-gray-100"
                    style={{ width: `${70 + (i % 3) * 10}%` }}
                  />
                ))}
              </div>
            )}

            {/* Error state */}
            {!isCreate && !isLoading && !invoice && (
              <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-gray-500">
                Failed to load invoice. It may have been deleted or you don&apos;t have access.
              </div>
            )}

            {/* View / Action mode (non-draft, non-edit) */}
            {!isLoading && invoice && !editMode && (
              <div className="flex flex-1 flex-col overflow-y-auto">
                <div className="flex-1 px-6 py-5">
                  {/* Info rows */}
                  <dl className="grid grid-cols-2 gap-4 text-sm">
                    {invoice.patient_id && (
                      <>
                        <dt className="text-gray-500">Patient ID</dt>
                        <dd className="font-medium text-gray-900">{invoice.patient_id}</dd>
                      </>
                    )}
                    {invoice.visit_id && (
                      <>
                        <dt className="text-gray-500">Visit ID</dt>
                        <dd className="font-medium text-gray-900">{invoice.visit_id}</dd>
                      </>
                    )}
                    <dt className="text-gray-500">Type</dt>
                    <dd className="font-medium text-gray-900 capitalize">
                      {invoice.invoice_type.toLowerCase().replace("_", " ")}
                    </dd>
                    {invoice.due_date && (
                      <>
                        <dt className="text-gray-500">Due Date</dt>
                        <dd className="font-medium text-gray-900">
                          {new Date(invoice.due_date).toLocaleDateString("en-US")}
                        </dd>
                      </>
                    )}
                    {invoice.notes && (
                      <>
                        <dt className="text-gray-500">Notes</dt>
                        <dd className="font-medium text-gray-900">{invoice.notes}</dd>
                      </>
                    )}
                  </dl>

                  {/* Line items */}
                  <div className="mt-6">
                    <h3 className="mb-3 text-sm font-semibold text-gray-700">Line Items</h3>
                    <div className="overflow-x-auto rounded-xl border border-gray-100">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
                            <th className="px-4 py-2 text-left font-medium">Service</th>
                            <th className="px-4 py-2 text-center font-medium">Qty</th>
                            <th className="px-4 py-2 text-right font-medium">Unit Price</th>
                            <th className="px-4 py-2 text-right font-medium">Discount</th>
                            <th className="px-4 py-2 text-right font-medium">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoice.items.map((item) => (
                            <tr
                              key={item.id}
                              className="border-b border-gray-50 last:border-0"
                            >
                              <td className="px-4 py-3 text-gray-900">{item.service_name}</td>
                              <td className="px-4 py-3 text-center text-gray-600">
                                {item.quantity}
                              </td>
                              <td className="px-4 py-3 text-right text-gray-600">
                                EGP{" "}
                                {item.unit_price.toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                })}
                              </td>
                              <td className="px-4 py-3 text-right text-gray-600">
                                {item.discount
                                  ? `EGP ${item.discount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                                  : "—"}
                              </td>
                              <td className="px-4 py-3 text-right font-medium text-gray-900">
                                EGP{" "}
                                {item.total.toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="mt-4 flex justify-end">
                    <InvoiceTotalsPanel items={invoice.items} className="w-72" />
                  </div>
                </div>

                {/* Action footer */}
                <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 px-6 py-4">
                  {canVoid && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => setVoidDialogOpen(true)}
                    >
                      <Ban className="size-3.5" aria-hidden="true" />
                      Void
                    </Button>
                  )}
                  {canEdit && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setEditMode(true)}
                    >
                      <Pencil className="size-3.5" aria-hidden="true" />
                      Edit
                    </Button>
                  )}
                  {canIssue && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() =>
                        issueMutation.mutate(invoiceId!, {
                          onSuccess: () => setEditMode(false),
                        })
                      }
                      disabled={issueMutation.isPending}
                    >
                      {issueMutation.isPending ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <Send className="size-3.5" aria-hidden="true" />
                      )}
                      Issue Invoice
                    </Button>
                  )}
                  {canRecordPayment && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setRecordPaymentOpen(true)}
                    >
                      <CreditCard className="size-3.5" aria-hidden="true" />
                      Record Payment
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Create / Edit mode */}
            {!isLoading && (isCreate || (invoice && editMode && isDraft)) && (
              <form onSubmit={onSubmit} className="flex flex-1 flex-col overflow-hidden">
                <div className="grid flex-1 grid-cols-[1fr_320px] gap-0 overflow-hidden">
                  {/* Left column */}
                  <div className="flex flex-col gap-5 overflow-y-auto px-6 py-5">
                    {/* Patient */}
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-700">
                        Patient ID <span className="text-red-500">*</span>
                      </label>
                      <input
                        {...form.register("patient_id")}
                        type="text"
                        placeholder="Patient ID"
                        className={cn(
                          inputClass,
                          form.formState.errors.patient_id && "border-red-400",
                        )}
                      />
                      {form.formState.errors.patient_id && (
                        <p className="mt-1 text-xs text-red-500">
                          {form.formState.errors.patient_id.message}
                        </p>
                      )}
                    </div>

                    {/* Visit ID */}
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-700">
                        Visit ID <span className="text-gray-400">(optional)</span>
                      </label>
                      <input
                        {...form.register("visit_id")}
                        type="text"
                        placeholder="Visit ID"
                        className={inputClass}
                      />
                    </div>

                    {/* Invoice type */}
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-700">
                        Invoice Type
                      </label>
                      <select
                        {...form.register("invoice_type")}
                        className={inputClass}
                      >
                        <option value="STANDARD">Standard</option>
                        <option value="FOLLOWUP">Follow-up</option>
                        <option value="PROFORMA">Proforma</option>
                        <option value="INSURANCE">Insurance</option>
                        <option value="REFUND">Refund</option>
                      </select>
                    </div>

                    {/* Due date */}
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-700">
                        Due Date <span className="text-gray-400">(optional)</span>
                      </label>
                      <input
                        {...form.register("due_date")}
                        type="date"
                        className={inputClass}
                      />
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-700">
                        Notes <span className="text-gray-400">(optional)</span>
                      </label>
                      <textarea
                        {...form.register("notes")}
                        rows={3}
                        placeholder="Additional notes…"
                        className={cn(inputClass, "resize-none")}
                      />
                    </div>

                    {/* Line items */}
                    <div>
                      <h3 className="mb-3 text-sm font-semibold text-gray-700">
                        Line Items
                      </h3>
                      <InvoiceLineItemsEditor
                        control={form.control}
                        setValue={form.setValue}
                        orgId={orgId}
                        branchId={branchId}
                        profileId={profileId}
                      />
                    </div>
                  </div>

                  {/* Right column — sticky totals */}
                  <div className="flex flex-col gap-4 border-l border-gray-100 bg-gray-50/50 px-5 py-5">
                    <h3 className="text-sm font-semibold text-gray-700">Summary</h3>
                    <InvoiceTotalsPanel items={watchedItems} />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                        Saving…
                      </>
                    ) : (
                      "Save as Draft"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Record Payment nested drawer */}
      {invoice && (
        <RecordPaymentDrawer
          open={recordPaymentOpen}
          onOpenChange={setRecordPaymentOpen}
          invoiceId={invoice.id}
          outstandingAmount={invoice.amount_due}
          onSuccess={() => setRecordPaymentOpen(false)}
        />
      )}

      {/* Void dialog */}
      {invoice && (
        <VoidInvoiceDialog
          open={voidDialogOpen}
          onOpenChange={setVoidDialogOpen}
          invoiceId={invoice.id}
          onSuccess={() => {
            setVoidDialogOpen(false);
          }}
        />
      )}
    </>
  );
}
