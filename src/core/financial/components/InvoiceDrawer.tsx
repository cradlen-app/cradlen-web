"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog } from "radix-ui";
import { useForm, useWatch, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Loader2, FileText, CreditCard, Ban, Send, Pencil, FilePlus2, Printer } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/common/utils/utils";
import { Button } from "@/components/ui/button";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { useVisitCharges } from "../hooks/useCharges";
import { useInvoice } from "../hooks/useInvoice";
import { useCreateInvoice } from "../hooks/useCreateInvoice";
import { useBuildInvoiceFromCharges } from "../hooks/useBuildInvoiceFromCharges";
import { useAppendChargesToInvoice } from "../hooks/useAppendChargesToInvoice";
import { useUpdateInvoice } from "../hooks/useUpdateInvoice";
import { useIssueInvoice } from "../hooks/useIssueInvoice";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import { InvoiceTotalsPanel } from "./InvoiceTotalsPanel";
import { InvoiceLineItemsEditor } from "./InvoiceLineItemsEditor";
import { InvoicePaymentsPanel } from "./InvoicePaymentsPanel";
import { InvoicePrintModal } from "./InvoicePrintModal";
import { RecordPaymentDrawer } from "./RecordPaymentDrawer";
import { VoidInvoiceDialog } from "./VoidInvoiceDialog";
import { formatMoney } from "../lib/format";
import type { EmbeddedPerson } from "../types/financial.types";

/**
 * Best-effort display name from an optional nested person relation. Backend
 * does not currently include patient/doctor on invoice responses — callers
 * pass `fallback` (the raw UUID) so the UI still shows something useful.
 */
function personName(
  person: EmbeddedPerson | null | undefined,
  fallback: string,
): string {
  if (!person) return fallback;
  if (person.full_name) return person.full_name;
  const composed = [person.first_name, person.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  return composed || fallback;
}

// ── Schema ────────────────────────────────────────────────────────────────────

export const invoiceFormSchema = z.object({
  patient_id: z.string().min(1, "Patient is required"),
  visit_id: z.string().optional(),
  /**
   * Carried in form state so price resolution can use the doctor's overrides.
   * NOT sent in create/update payloads — backend doesn't accept it on those
   * endpoints (the visit relation already pins the doctor).
   */
  doctor_id: z.string().optional(),
  invoice_type: z.enum(["STANDARD", "FOLLOWUP", "PROFORMA", "INSURANCE", "REFUND"]),
  due_date: z.string().optional(),
  notes: z.string().optional(),
  /** Invoice-level discount. "NONE" submits no discount. */
  discount_type: z.enum(["NONE", "PERCENTAGE", "FIXED"]),
  discount_value: z.number().nonnegative(),
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
    /** Display name for the patient, shown read-only instead of the raw UUID. */
    patientName?: string;
    visitId?: string;
    /** Clinical case (episode) the invoice bills; links the case so later sessions reuse it. */
    episodeId?: string;
    /**
     * Doctor for the visit. Used only for price-resolution context inside the
     * line-items editor; NOT sent to the backend create/update endpoints.
     */
    doctorId?: string;
    /** Display name for the assigned doctor, shown read-only. */
    doctorName?: string;
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
  const t = useTranslations("financial.invoice");
  const tCommon = useTranslations("financial.common");
  const branchId = useAuthContextStore((s) => s.branchId) ?? "";
  const currentProfileId =
    useAuthContextStore((s) => s.profileId) ?? undefined;

  const [editMode, setEditMode] = useState(!invoiceId);
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);

  // Data
  const { invoice, isLoading } = useInvoice(invoiceId);

  // Mutations
  const createMutation = useCreateInvoice();
  const buildMutation = useBuildInvoiceFromCharges();
  const appendMutation = useAppendChargesToInvoice();
  const updateMutation = useUpdateInvoice();
  const issueMutation = useIssueInvoice();

  const isCreate = !invoiceId;
  const isDraft = invoice?.status === "DRAFT" || isCreate;
  const canEdit = isCreate || invoice?.status === "DRAFT";
  const canIssue = invoice?.status === "DRAFT";
  const canRecordPayment =
    invoice?.status === "ISSUED" || invoice?.status === "PARTIALLY_PAID";
  const canVoid = invoice?.status === "DRAFT";
  // A later charge (e.g. a service the doctor just added) can be appended to the
  // case's open invoice, reopening it for the new balance.
  const canAppendCharges =
    invoice?.status === "ISSUED" ||
    invoice?.status === "PARTIALLY_PAID" ||
    invoice?.status === "PAID";

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      patient_id: prefill?.patientId ?? "",
      visit_id: prefill?.visitId ?? "",
      doctor_id: prefill?.doctorId ?? "",
      invoice_type: "STANDARD",
      due_date: "",
      notes: "",
      discount_type: "NONE",
      discount_value: 0,
      items: [],
    },
  });

  useEffect(() => {
    if (invoice && editMode) {
      form.reset({
        patient_id: invoice.patient_id ?? "",
        visit_id: invoice.visit_id ?? "",
        doctor_id: invoice.assigned_doctor_id ?? prefill?.doctorId ?? "",
        invoice_type: invoice.invoice_type,
        due_date: invoice.due_date ?? "",
        notes: invoice.notes ?? "",
        discount_type: invoice.discount_type ?? "NONE",
        discount_value: invoice.discount_value ?? 0,
        items: invoice.items.map((i) => ({
          service_id: i.service_id ?? undefined,
          description: i.description,
          quantity: i.quantity,
          unit_price: i.unit_price,
          discount_amount: i.discount_amount ?? undefined,
          pricing_source: i.pricing_source,
        })),
      });
    }
  }, [invoice?.id, editMode, form, invoice, prefill?.doctorId]);

  // Create mode: `defaultValues` are captured once at mount, but this drawer is
  // mounted before any row is clicked, so the prefill arrives later. Re-apply it
  // whenever the drawer opens for a new invoice.
  useEffect(() => {
    if (open && isCreate) {
      form.reset({
        patient_id: prefill?.patientId ?? "",
        visit_id: prefill?.visitId ?? "",
        doctor_id: prefill?.doctorId ?? "",
        invoice_type: "STANDARD",
        due_date: "",
        notes: "",
        discount_type: "NONE",
        discount_value: 0,
        items: [],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isCreate, prefill?.patientId, prefill?.visitId, prefill?.doctorId]);

  // Single field array owned here so imports/auto-stage and the editor share
  // one instance (two useFieldArray on the same name don't re-render in sync).
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // The visit's open charges — staged into a new invoice (create mode) or
  // appended to the case's existing invoice (view mode).
  const { charges: visitCharges } = useVisitCharges(prefill?.visitId);
  const pendingCharges = visitCharges.filter((c) => c.status === "PENDING");

  function importVisitCharges() {
    const existing = form.getValues("items");
    const seen = new Set(
      existing.map((it) => `${it.service_id ?? ""}|${it.description}`),
    );
    for (const c of pendingCharges) {
      const key = `${c.service_id ?? ""}|${c.description}`;
      if (seen.has(key)) continue;
      seen.add(key);
      append({
        service_id: c.service_id ?? undefined,
        description: c.description,
        quantity: c.quantity,
        unit_price: Number(c.unit_price),
        discount_amount: undefined,
        pricing_source: c.pricing_source,
      });
    }
  }

  // Auto-stage the visit's pending charges on open so the bill is pre-filled and
  // reception can settle in one action. Guarded so manual edits aren't clobbered.
  const autoStagedRef = useRef(false);
  useEffect(() => {
    if (!open) {
      autoStagedRef.current = false;
      return;
    }
    if (
      isCreate &&
      !autoStagedRef.current &&
      pendingCharges.length > 0 &&
      form.getValues("items").length === 0
    ) {
      autoStagedRef.current = true;
      importVisitCharges();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isCreate, pendingCharges]);

  const watchedItems = useWatch({ control: form.control, name: "items" });
  const watchedDoctorId = useWatch({ control: form.control, name: "doctor_id" });
  const watchedDiscountType = useWatch({
    control: form.control,
    name: "discount_type",
  });
  const watchedDiscountValue = useWatch({
    control: form.control,
    name: "discount_value",
  });
  // Prefer the visit's assigned doctor; fall back to current user for price
  // resolution when no doctor is associated with the draft yet.
  const priceResolutionProfileId =
    (watchedDoctorId && watchedDoctorId.length > 0
      ? watchedDoctorId
      : currentProfileId) ?? undefined;

  function handleClose() {
    form.reset();
    setEditMode(!invoiceId);
    onOpenChange(false);
  }

  // A visit invoice is charge-backed: its lines come from PENDING charges, which
  // must be consumed (flipped INVOICED) so the case has a single source of truth
  // and later charges can be appended without double-billing. A purely manual
  // invoice (no visit charges) keeps the free-form line-items path.
  const isChargeBacked = !!prefill?.visitId && pendingCharges.length > 0;

  async function runCreate(issue: boolean) {
    const data = form.getValues();
    if (!data.patient_id) {
      void form.trigger("patient_id");
      return;
    }
    const discountFields =
      data.discount_type === "NONE"
        ? {}
        : {
            discount_type: data.discount_type,
            discount_value: data.discount_value,
          };
    try {
      const created = isChargeBacked
        ? await buildMutation.mutateAsync({
            branch_id: branchId,
            patient_id: data.patient_id,
            visit_id: prefill?.visitId,
            episode_id: prefill?.episodeId,
            charge_ids: pendingCharges.map((c) => c.id),
            invoice_type: data.invoice_type,
            due_date: data.due_date || undefined,
            notes: data.notes || undefined,
            ...discountFields,
          })
        : await createMutation.mutateAsync({
            branch_id: branchId,
            patient_id: data.patient_id,
            visit_id: data.visit_id || undefined,
            episode_id: prefill?.episodeId,
            invoice_type: data.invoice_type,
            due_date: data.due_date || undefined,
            notes: data.notes || undefined,
            ...discountFields,
            items: data.items.map((item) => ({
              service_id: item.service_id || undefined,
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_price,
            })),
          });
      const newId = created?.data?.id;
      if (issue && newId) {
        await issueMutation.mutateAsync(newId);
      }
      form.reset();
      onOpenChange(false);
    } catch {
      // The mutation hooks surface an error toast; keep the drawer open.
    }
  }

  const onSubmit = form.handleSubmit((data) => {
    if (isCreate) {
      void runCreate(false);
      return;
    }
    const discountFields =
      data.discount_type === "NONE"
        ? {}
        : {
            discount_type: data.discount_type,
            discount_value: data.discount_value,
          };
    updateMutation.mutate(
      {
        id: invoiceId!,
        payload: {
          // Backend UpdateInvoiceDto does NOT accept invoice_type — drop it.
          due_date: data.due_date || undefined,
          notes: data.notes || undefined,
          ...discountFields,
          items: data.items.map((item) => ({
            service_id: item.service_id || undefined,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
          })),
        },
      },
      {
        onSuccess: () => setEditMode(false),
      },
    );
  });

  function handleAppendCharges() {
    if (!invoiceId || pendingCharges.length === 0) return;
    appendMutation.mutate({
      invoiceId,
      payload: { charge_ids: pendingCharges.map((c) => c.id) },
    });
  }

  const isSaving =
    createMutation.isPending ||
    buildMutation.isPending ||
    issueMutation.isPending ||
    updateMutation.isPending;

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
                  {isCreate
                    ? t("newInvoice")
                    : `${t("invoiceNumberPrefix")} #${invoice?.invoice_number ?? "…"}`}
                </Dialog.Title>
                {invoice && <InvoiceStatusBadge status={invoice.status} />}
              </div>
              <Dialog.Close
                className="inline-flex size-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100"
                aria-label={tCommon("close")}
                onClick={handleClose}
              >
                <X className="size-5" aria-hidden="true" />
              </Dialog.Close>
            </div>

            {/* Loading skeleton */}
            {isLoading && <InvoiceViewSkeleton />}

            {/* Error state */}
            {!isCreate && !isLoading && !invoice && (
              <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-gray-500">
                {t("view.loadError")}
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
                        <dt className="text-gray-500">{t("fields.patient")}</dt>
                        <dd className="font-medium text-gray-900">
                          {prefill?.patientName ??
                            personName(invoice.patient, invoice.patient_id)}
                        </dd>
                      </>
                    )}
                    {(prefill?.doctorName || invoice.assigned_doctor_id) && (
                      <>
                        <dt className="text-gray-500">{t("fields.doctor")}</dt>
                        <dd className="font-medium text-gray-900">
                          {prefill?.doctorName ??
                            personName(
                              invoice.doctor,
                              invoice.assigned_doctor_id ?? "",
                            )}
                        </dd>
                      </>
                    )}
                    {invoice.visit_id && (
                      <>
                        <dt className="text-gray-500">{t("fields.visitId")}</dt>
                        <dd className="font-medium text-gray-900">{invoice.visit_id}</dd>
                      </>
                    )}
                    <dt className="text-gray-500">{t("fields.type")}</dt>
                    <dd className="font-medium text-gray-900">
                      {t(`types.${invoice.invoice_type}`)}
                    </dd>
                    {invoice.due_date && (
                      <>
                        <dt className="text-gray-500">{t("fields.dueDate")}</dt>
                        <dd className="font-medium text-gray-900">
                          {new Date(invoice.due_date).toLocaleDateString("en-US")}
                        </dd>
                      </>
                    )}
                    {invoice.notes && (
                      <>
                        <dt className="text-gray-500">{t("fields.notes")}</dt>
                        <dd className="font-medium text-gray-900">{invoice.notes}</dd>
                      </>
                    )}
                  </dl>

                  {/* Line items */}
                  <div className="mt-6">
                    <h3 className="mb-3 text-sm font-semibold text-gray-700">{t("view.lineItems")}</h3>
                    <div className="overflow-x-auto rounded-xl border border-gray-100">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
                            <th className="px-4 py-2 text-left font-medium">{t("lineItems.service")}</th>
                            <th className="px-4 py-2 text-center font-medium">{t("lineItems.qty")}</th>
                            <th className="px-4 py-2 text-right font-medium">{t("lineItems.unitPrice")}</th>
                            <th className="px-4 py-2 text-right font-medium">{t("lineItems.discount")}</th>
                            <th className="px-4 py-2 text-right font-medium">{t("lineItems.total")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoice.items.map((item) => (
                            <tr
                              key={item.id}
                              className="border-b border-gray-50 last:border-0"
                            >
                              <td className="px-4 py-3 text-gray-900">{item.description}</td>
                              <td className="px-4 py-3 text-center text-gray-600">
                                {item.quantity}
                              </td>
                              <td className="px-4 py-3 text-right text-gray-600">
                                {formatMoney(item.unit_price, invoice.currency)}
                              </td>
                              <td className="px-4 py-3 text-right text-gray-600">
                                {item.discount_amount
                                  ? formatMoney(item.discount_amount, invoice.currency)
                                  : "—"}
                              </td>
                              <td className="px-4 py-3 text-right font-medium text-gray-900">
                                {formatMoney(item.total_amount, invoice.currency)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="mt-4 flex justify-end">
                    <InvoiceTotalsPanel
                      items={invoice.items}
                      currency={invoice.currency}
                      discountType={invoice.discount_type ?? "NONE"}
                      discountValue={invoice.discount_value ?? 0}
                      invoice={invoice}
                      className="w-72"
                    />
                  </div>

                  {/* Payments */}
                  {invoice.status !== "DRAFT" && (
                    <div className="mt-6">
                      <InvoicePaymentsPanel
                        invoiceId={invoice.id}
                        currency={invoice.currency}
                      />
                    </div>
                  )}
                </div>

                {/* Action footer */}
                <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 px-6 py-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setPrintOpen(true)}
                  >
                    <Printer className="size-3.5" aria-hidden="true" />
                    {t("actions.printInvoice")}
                  </Button>
                  {canVoid && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => setVoidDialogOpen(true)}
                    >
                      <Ban className="size-3.5" aria-hidden="true" />
                      {t("actions.voidShort")}
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
                      {t("actions.edit")}
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
                      {t("actions.issue")}
                    </Button>
                  )}
                  {canAppendCharges && pendingCharges.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAppendCharges}
                      disabled={appendMutation.isPending}
                    >
                      {appendMutation.isPending ? (
                        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                      ) : (
                        <FilePlus2 className="size-3.5" aria-hidden="true" />
                      )}
                      {t("actions.addChargesToInvoice", {
                        count: pendingCharges.length,
                      })}
                    </Button>
                  )}
                  {canRecordPayment && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setRecordPaymentOpen(true)}
                    >
                      <CreditCard className="size-3.5" aria-hidden="true" />
                      {t("actions.recordPayment")}
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
                    {prefill?.patientName ? (
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-gray-700">
                          {t("fields.patient")}
                        </label>
                        <div className={cn(inputClass, "bg-gray-50 text-gray-700")}>
                          {prefill.patientName}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-gray-700">
                          {t("fields.patientId")} <span className="text-red-500">*</span>
                        </label>
                        <input
                          {...form.register("patient_id")}
                          type="text"
                          placeholder={t("fields.patientIdPlaceholder")}
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
                    )}

                    {/* Doctor — read-only display when known from the visit */}
                    {prefill?.doctorName && (
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-gray-700">
                          {t("fields.doctor")}
                        </label>
                        <div className={cn(inputClass, "bg-gray-50 text-gray-700")}>
                          {prefill.doctorName}
                        </div>
                      </div>
                    )}

                    {/* Visit ID — read-only when pinned by the visit */}
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-700">
                        {t("fields.visitId")} <span className="text-gray-400">{tCommon("optional")}</span>
                      </label>
                      <input
                        {...form.register("visit_id")}
                        type="text"
                        placeholder={t("fields.visitIdPlaceholder")}
                        readOnly={!!prefill?.visitId}
                        className={cn(
                          inputClass,
                          prefill?.visitId && "bg-gray-50 text-gray-500",
                        )}
                      />
                    </div>

                    {/* Invoice type */}
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-700">
                        {t("fields.invoiceType")}
                      </label>
                      <select
                        {...form.register("invoice_type")}
                        className={inputClass}
                      >
                        <option value="STANDARD">{t("types.STANDARD")}</option>
                        <option value="FOLLOWUP">{t("types.FOLLOWUP")}</option>
                        <option value="PROFORMA">{t("types.PROFORMA")}</option>
                        <option value="INSURANCE">{t("types.INSURANCE")}</option>
                        <option value="REFUND">{t("types.REFUND")}</option>
                      </select>
                    </div>

                    {/* Due date */}
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-700">
                        {t("fields.dueDate")} <span className="text-gray-400">{tCommon("optional")}</span>
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
                        {t("fields.notes")} <span className="text-gray-400">{tCommon("optional")}</span>
                      </label>
                      <textarea
                        {...form.register("notes")}
                        rows={3}
                        placeholder={t("fields.notesPlaceholder")}
                        className={cn(inputClass, "resize-none")}
                      />
                    </div>

                    {/* Line items */}
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-700">
                          {t("view.lineItems")}
                        </h3>
                        {isCreate && pendingCharges.length > 0 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={importVisitCharges}
                          >
                            <FilePlus2 className="size-3.5" aria-hidden="true" />
                            {t("actions.importCharges", {
                              count: pendingCharges.length,
                            })}
                          </Button>
                        )}
                      </div>
                      <InvoiceLineItemsEditor
                        control={form.control}
                        setValue={form.setValue}
                        fields={fields}
                        append={append}
                        remove={remove}
                        branchId={branchId}
                        profileId={priceResolutionProfileId}
                        currency={invoice?.currency}
                      />
                    </div>
                  </div>

                  {/* Right column — sticky totals */}
                  <div className="flex flex-col gap-4 border-l border-gray-100 bg-gray-50/50 px-5 py-5">
                    <h3 className="text-sm font-semibold text-gray-700">{t("view.summary")}</h3>

                    {/* Invoice-level discount */}
                    <div className="rounded-xl border border-gray-200 bg-white p-3">
                      <label className="mb-1.5 block text-xs font-medium text-gray-700">
                        {t("discount.label")}
                      </label>
                      <div className="flex gap-2">
                        <select
                          {...form.register("discount_type")}
                          className={cn(inputClass, "flex-1")}
                        >
                          <option value="NONE">{t("discount.none")}</option>
                          <option value="PERCENTAGE">{t("discount.percentage")}</option>
                          <option value="FIXED">{t("discount.fixed")}</option>
                        </select>
                        {watchedDiscountType !== "NONE" && (
                          <input
                            {...form.register("discount_value", {
                              valueAsNumber: true,
                            })}
                            type="number"
                            min={0}
                            step="0.01"
                            placeholder={t("discount.valuePlaceholder")}
                            className={cn(inputClass, "w-28")}
                          />
                        )}
                      </div>
                    </div>

                    <InvoiceTotalsPanel
                      items={watchedItems}
                      currency={invoice?.currency}
                      discountType={watchedDiscountType}
                      discountValue={watchedDiscountValue}
                      invoice={invoice ?? null}
                    />
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
                    {tCommon("cancel")}
                  </Button>
                  {isCreate ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void runCreate(false)}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                        ) : null}
                        {t("actions.saveAsDraft")}
                      </Button>
                      <Button
                        type="button"
                        onClick={() => void runCreate(true)}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <Send className="size-3.5" aria-hidden="true" />
                        )}
                        {t("actions.createAndIssue")}
                      </Button>
                    </>
                  ) : (
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                          {tCommon("saving")}
                        </>
                      ) : (
                        tCommon("save")
                      )}
                    </Button>
                  )}
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
          outstandingAmount={invoice.total_amount - invoice.paid_amount}
          currency={invoice.currency}
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

      {/* Print invoice */}
      {invoice && (
        <InvoicePrintModal
          open={printOpen}
          onOpenChange={setPrintOpen}
          invoice={invoice}
          patientName={prefill?.patientName}
          doctorName={prefill?.doctorName}
        />
      )}
    </>
  );
}

const bar = "animate-pulse rounded bg-gray-100";

/** View-mode loading placeholder mirroring the info grid / line items / totals / payments. */
function InvoiceViewSkeleton() {
  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-6 py-5">
      {/* Info grid */}
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className={cn(bar, "h-4 w-20")} />
            <div className={cn(bar, "h-4 w-32")} />
          </div>
        ))}
      </div>

      {/* Line items */}
      <div className="mt-6">
        <div className={cn(bar, "mb-3 h-4 w-24")} />
        <div className="overflow-hidden rounded-xl border border-gray-100">
          <div className="border-b border-gray-100 bg-gray-50 px-4 py-2.5">
            <div className={cn(bar, "h-3 w-full max-w-md")} />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between border-b border-gray-50 px-4 py-3 last:border-0"
            >
              <div className={cn(bar, "h-4 w-40")} />
              <div className={cn(bar, "h-4 w-16")} />
            </div>
          ))}
        </div>
      </div>

      {/* Totals card */}
      <div className="mt-4 flex justify-end">
        <div className="w-72 rounded-xl border border-gray-200 p-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-1.5">
              <div className={cn(bar, "h-4 w-16")} />
              <div className={cn(bar, "h-4 w-20")} />
            </div>
          ))}
        </div>
      </div>

      {/* Payments */}
      <div className="mt-6 rounded-xl border border-gray-200">
        <div className="border-b border-gray-100 px-4 py-2.5">
          <div className={cn(bar, "h-4 w-24")} />
        </div>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-2.5">
            <div className="space-y-1.5">
              <div className={cn(bar, "h-4 w-24")} />
              <div className={cn(bar, "h-3 w-32")} />
            </div>
            <div className={cn(bar, "h-7 w-7 rounded-lg")} />
          </div>
        ))}
      </div>
    </div>
  );
}
