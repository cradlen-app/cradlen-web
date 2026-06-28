"use client";

import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog } from "radix-ui";
import { useForm, useWatch, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/common/utils/utils";
import { financialQueryKeys } from "@/core/financial/queryKeys";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { useVisitCharges } from "../hooks/useCharges";
import { useInvoice } from "../hooks/useInvoice";
import { useCreateInvoice } from "../hooks/useCreateInvoice";
import { useBuildInvoiceFromCharges } from "../hooks/useBuildInvoiceFromCharges";
import { useAppendChargesToInvoice } from "../hooks/useAppendChargesToInvoice";
import { useUpdateInvoice } from "../hooks/useUpdateInvoice";
import { useIssueInvoice } from "../hooks/useIssueInvoice";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import { InvoiceViewMode } from "./InvoiceViewMode";
import { InvoiceEditForm } from "./InvoiceEditForm";
import { InvoicePrintModal } from "./InvoicePrintModal";
import { RecordPaymentDrawer } from "./RecordPaymentDrawer";
import { VoidInvoiceDialog } from "./VoidInvoiceDialog";
import { personName } from "../lib/format";

// ── Schema ────────────────────────────────────────────────────────────────────

export const invoiceFormSchema = z.object({
  patient_id: z.string().min(1, "Patient is required"),
  /** Display name of the selected patient — for the preview, not sent. */
  patient_name: z.string().optional(),
  visit_id: z.string().optional(),
  /**
   * Assigned provider. Sent as `assigned_doctor_id` on create/update (the
   * backend accepts it) and used for line-item price resolution. Required on
   * standalone create — enforced in `runCreate`, not the schema, because the
   * visit-backed path pins the doctor server-side.
   */
  doctor_id: z.string().optional(),
  /** Display name of the selected doctor — for the preview, not sent. */
  doctor_name: z.string().optional(),
  /** Invoice currency (create only; UpdateInvoiceDto has no currency). */
  currency: z.string(),
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
    /**
     * Doctor for the visit. Used only for price-resolution context inside the
     * line-items editor; NOT sent to the backend create/update endpoints.
     */
    doctorId?: string;
    /** Display name for the assigned doctor, shown read-only. */
    doctorName?: string;
  };
};

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
  const organizationId =
    useAuthContextStore((s) => s.organizationId) ?? undefined;
  const currentProfileId =
    useAuthContextStore((s) => s.profileId) ?? undefined;

  const [editMode, setEditMode] = useState(!invoiceId);
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);

  const qc = useQueryClient();

  // Data
  const { invoice, isLoading } = useInvoice(invoiceId);

  // A mid-visit charge is auto-billed onto the visit invoice by an async,
  // post-commit backend listener, so the invalidation fired at capture time
  // races ahead of the accrual and re-reads the pre-accrual invoice. Re-pull the
  // invoice + charge state when this drawer opens (the listener has settled by
  // then), with one short delayed retry to absorb listener latency, so a service
  // added mid-visit shows up without a full page reload.
  useEffect(() => {
    if (!open) return;
    const refresh = () => {
      void qc.invalidateQueries({
        queryKey: financialQueryKeys.invoices.all(),
      });
      if (prefill?.visitId) {
        void qc.invalidateQueries({
          queryKey: financialQueryKeys.charges.byVisit(prefill.visitId),
        });
      }
    };
    refresh();
    const timer = setTimeout(refresh, 1200);
    return () => clearTimeout(timer);
  }, [open, qc, invoiceId, prefill?.visitId]);

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
      patient_name: prefill?.patientName ?? "",
      visit_id: prefill?.visitId ?? "",
      doctor_id: prefill?.doctorId ?? "",
      doctor_name: prefill?.doctorName ?? "",
      currency: "EGP",
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
        patient_name:
          prefill?.patientName ??
          personName(invoice.patient, invoice.patient_id ?? ""),
        visit_id: invoice.visit_id ?? "",
        doctor_id: invoice.assigned_doctor_id ?? prefill?.doctorId ?? "",
        doctor_name:
          prefill?.doctorName ??
          (invoice.assigned_doctor_id
            ? personName(invoice.doctor, invoice.assigned_doctor_id)
            : ""),
        currency: invoice.currency ?? "EGP",
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
  }, [
    invoice?.id,
    editMode,
    form,
    invoice,
    prefill?.doctorId,
    prefill?.patientName,
    prefill?.doctorName,
  ]);

  // Create mode: `defaultValues` are captured once at mount, but this drawer is
  // mounted before any row is clicked, so the prefill arrives later. Re-apply it
  // whenever the drawer opens for a new invoice.
  useEffect(() => {
    if (open && isCreate) {
      form.reset({
        patient_id: prefill?.patientId ?? "",
        patient_name: prefill?.patientName ?? "",
        visit_id: prefill?.visitId ?? "",
        doctor_id: prefill?.doctorId ?? "",
        doctor_name: prefill?.doctorName ?? "",
        currency: "EGP",
        invoice_type: "STANDARD",
        due_date: "",
        notes: "",
        discount_type: "NONE",
        discount_value: 0,
        items: [],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    open,
    isCreate,
    prefill?.patientId,
    prefill?.patientName,
    prefill?.visitId,
    prefill?.doctorId,
    prefill?.doctorName,
  ]);

  // `editMode` is seeded from `invoiceId` at mount, but this drawer is mounted
  // persistently (InvoicePanel) — invoiceId arrives via props after mount. Re-sync
  // the mode each time the drawer opens (or the invoice changes while open) so an
  // existing invoice opens in view mode (create/draft default to edit) instead of
  // falling through to a blank body. Done during render rather than in an effect to
  // avoid the cascading re-render that setState-in-effect triggers.
  const openSyncKey = `${open ? "1" : "0"}|${invoiceId ?? ""}`;
  const [lastOpenSyncKey, setLastOpenSyncKey] = useState(openSyncKey);
  if (openSyncKey !== lastOpenSyncKey) {
    setLastOpenSyncKey(openSyncKey);
    if (open) setEditMode(!invoiceId);
  }

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

  // Drives line-item price resolution; the rest of the live-preview watches now
  // live inside InvoiceEditForm.
  const watchedDoctorId = useWatch({ control: form.control, name: "doctor_id" });
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
    // Standalone (non-visit) invoices must name a provider; the visit-backed
    // path pins the doctor server-side, so only guard the manual create.
    if (!prefill?.visitId && !data.doctor_id) {
      form.setError("doctor_id", {
        type: "manual",
        message: t("fields.doctorRequired"),
      });
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
            assigned_doctor_id: data.doctor_id || undefined,
            currency: data.currency || undefined,
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
          // UpdateInvoiceDto accepts assigned_doctor_id but not invoice_type/currency.
          assigned_doctor_id: data.doctor_id || undefined,
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

  // Create/edit shows the split form + live preview, so the drawer is wider.
  const isEditing = !isLoading && (isCreate || (!!invoice && editMode && isDraft));

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <Dialog.Root open={open} onOpenChange={(next) => !next && handleClose()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/35" />
          <Dialog.Content
            className={cn(
              "fixed inset-0 z-50 flex h-dvh flex-col bg-white shadow-2xl outline-none",
              "sm:inset-y-0 sm:start-auto sm:inset-e-0",
              "sm:ltr:rounded-l-2xl sm:rtl:rounded-r-2xl",
              isEditing
                ? "sm:w-[94vw] sm:max-w-6xl"
                : "sm:w-[80vw] sm:max-w-4xl",
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
              <InvoiceViewMode
                invoice={invoice}
                patientName={prefill?.patientName}
                doctorName={prefill?.doctorName}
                canVoid={canVoid}
                canEdit={canEdit}
                canIssue={canIssue}
                canAppendCharges={canAppendCharges}
                canRecordPayment={canRecordPayment}
                pendingChargeCount={pendingCharges.length}
                issuing={issueMutation.isPending}
                appending={appendMutation.isPending}
                onPrint={() => setPrintOpen(true)}
                onVoid={() => setVoidDialogOpen(true)}
                onEdit={() => setEditMode(true)}
                onIssue={() =>
                  issueMutation.mutate(invoiceId!, {
                    onSuccess: () => setEditMode(false),
                  })
                }
                onAppendCharges={handleAppendCharges}
                onRecordPayment={() => setRecordPaymentOpen(true)}
              />
            )}

            {/* Create / Edit mode */}
            {!isLoading && (isCreate || (invoice && editMode && isDraft)) && (
              <InvoiceEditForm
                form={form}
                invoice={invoice}
                patientName={prefill?.patientName}
                doctorName={prefill?.doctorName}
                visitId={prefill?.visitId}
                organizationId={organizationId}
                branchId={branchId}
                isCreate={isCreate}
                isSaving={isSaving}
                fields={fields}
                append={append}
                remove={remove}
                pendingChargeCount={pendingCharges.length}
                priceResolutionProfileId={priceResolutionProfileId}
                onSubmit={onSubmit}
                onClose={handleClose}
                onSaveDraft={() => void runCreate(false)}
                onCreateAndIssue={() => void runCreate(true)}
                onImportCharges={importVisitCharges}
              />
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
