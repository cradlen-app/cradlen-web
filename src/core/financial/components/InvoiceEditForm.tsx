"use client";

import type { FormEventHandler } from "react";
import {
  useWatch,
  type FieldArrayWithId,
  type UseFieldArrayAppend,
  type UseFieldArrayRemove,
  type UseFormReturn,
} from "react-hook-form";
import { FilePlus2, Loader2, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/common/utils/utils";
import { Button } from "@/components/ui/button";
import { InvoiceLineItemsEditor } from "./InvoiceLineItemsEditor";
import { InvoicePreview } from "./InvoicePreview";
import { InvoicePatientSelect } from "./InvoicePatientSelect";
import { InvoiceDoctorSelect } from "./InvoiceDoctorSelect";
import type { InvoiceFormValues } from "./invoice-form.schema";
import type { Invoice } from "../types/financial.types";

/** Currencies offered in the create-mode currency selector. */
const CURRENCY_OPTIONS = ["EGP", "USD", "EUR", "SAR", "AED"] as const;

const inputClass = cn(
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900",
  "placeholder:text-gray-400 outline-none transition-colors",
  "focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20",
);

type InvoiceEditFormProps = {
  form: UseFormReturn<InvoiceFormValues>;
  invoice: Invoice | undefined;
  /** Prefill display names / pinned visit, shown read-only when present. */
  patientName?: string;
  doctorName?: string;
  visitId?: string;
  organizationId?: string;
  branchId: string;
  isCreate: boolean;
  isSaving: boolean;
  /** Shared field array from the parent so imports/auto-stage stay in sync. */
  fields: FieldArrayWithId<InvoiceFormValues, "items", "id">[];
  append: UseFieldArrayAppend<InvoiceFormValues, "items">;
  remove: UseFieldArrayRemove;
  pendingChargeCount: number;
  priceResolutionProfileId?: string;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onClose: () => void;
  onSaveDraft: () => void;
  onCreateAndIssue: () => void;
  onImportCharges: () => void;
};

/**
 * Create/edit half of the invoice drawer: the left-column form fields plus the
 * right-column live preview and the save footer. Extracted from `InvoiceDrawer`;
 * the parent owns the form instance, mutations, and the shared field array — this
 * component renders them and reads the live preview values via `useWatch`.
 */
export function InvoiceEditForm({
  form,
  invoice,
  patientName,
  doctorName,
  visitId,
  organizationId,
  branchId,
  isCreate,
  isSaving,
  fields,
  append,
  remove,
  pendingChargeCount,
  priceResolutionProfileId,
  onSubmit,
  onClose,
  onSaveDraft,
  onCreateAndIssue,
  onImportCharges,
}: InvoiceEditFormProps) {
  const t = useTranslations("financial.invoice");
  const tCommon = useTranslations("financial.common");

  const watchedItems = useWatch({ control: form.control, name: "items" });
  const watchedDiscountType = useWatch({
    control: form.control,
    name: "discount_type",
  });
  const watchedDiscountValue = useWatch({
    control: form.control,
    name: "discount_value",
  });
  const watchedCurrency = useWatch({ control: form.control, name: "currency" });
  const watchedPatientName = useWatch({
    control: form.control,
    name: "patient_name",
  });
  const watchedDoctorName = useWatch({
    control: form.control,
    name: "doctor_name",
  });
  const watchedDueDate = useWatch({ control: form.control, name: "due_date" });
  const watchedNotes = useWatch({ control: form.control, name: "notes" });

  return (
    <form onSubmit={onSubmit} className="flex flex-1 flex-col overflow-hidden">
      <div className="grid flex-1 grid-cols-1 gap-0 overflow-hidden lg:grid-cols-[minmax(360px,420px)_1fr]">
        {/* Left column — form */}
        <div className="flex flex-col gap-5 overflow-y-auto px-6 py-5">
          {/* Patient */}
          {patientName ? (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                {t("fields.patient")}
              </label>
              <div className={cn(inputClass, "bg-gray-50 text-gray-700")}>
                {patientName}
              </div>
            </div>
          ) : (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                {t("fields.patient")} <span className="text-red-500">*</span>
              </label>
              <InvoicePatientSelect
                displayName={watchedPatientName}
                error={!!form.formState.errors.patient_id}
                onChange={(id, name) => {
                  form.setValue("patient_id", id, {
                    shouldValidate: true,
                  });
                  form.setValue("patient_name", name);
                }}
              />
              {form.formState.errors.patient_id && (
                <p className="mt-1 text-xs text-red-500">
                  {form.formState.errors.patient_id.message}
                </p>
              )}
            </div>
          )}

          {/* Doctor */}
          {doctorName ? (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                {t("fields.doctor")}
              </label>
              <div className={cn(inputClass, "bg-gray-50 text-gray-700")}>
                {doctorName}
              </div>
            </div>
          ) : (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                {t("fields.doctor")} <span className="text-red-500">*</span>
              </label>
              <InvoiceDoctorSelect
                organizationId={organizationId}
                branchId={branchId}
                displayName={watchedDoctorName}
                error={!!form.formState.errors.doctor_id}
                onChange={(id, name) => {
                  form.setValue("doctor_id", id);
                  form.setValue("doctor_name", name);
                  form.clearErrors("doctor_id");
                }}
              />
              {form.formState.errors.doctor_id && (
                <p className="mt-1 text-xs text-red-500">
                  {form.formState.errors.doctor_id.message}
                </p>
              )}
            </div>
          )}

          {/* Visit ID — read-only, shown only when pinned by a visit */}
          {visitId && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                {t("fields.visitId")}
              </label>
              <input
                {...form.register("visit_id")}
                type="text"
                readOnly
                className={cn(inputClass, "bg-gray-50 text-gray-500")}
              />
            </div>
          )}

          {/* Invoice type + Currency */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                {t("fields.invoiceType")}
              </label>
              <select {...form.register("invoice_type")} className={inputClass}>
                <option value="STANDARD">{t("types.STANDARD")}</option>
                <option value="FOLLOWUP">{t("types.FOLLOWUP")}</option>
                <option value="PROFORMA">{t("types.PROFORMA")}</option>
                <option value="INSURANCE">{t("types.INSURANCE")}</option>
                <option value="REFUND">{t("types.REFUND")}</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                {t("fields.currency")}
              </label>
              {isCreate ? (
                <select {...form.register("currency")} className={inputClass}>
                  {CURRENCY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              ) : (
                <div className={cn(inputClass, "bg-gray-50 text-gray-500")}>
                  {invoice?.currency ?? watchedCurrency}
                </div>
              )}
            </div>
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
              {isCreate && pendingChargeCount > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onImportCharges}
                >
                  <FilePlus2 className="size-3.5" aria-hidden="true" />
                  {t("actions.importCharges", { count: pendingChargeCount })}
                </Button>
              )}
            </div>
            <InvoiceLineItemsEditor
              control={form.control}
              setValue={form.setValue}
              getValues={form.getValues}
              fields={fields}
              append={append}
              remove={remove}
              branchId={branchId}
              profileId={priceResolutionProfileId}
              currency={watchedCurrency ?? invoice?.currency}
            />
          </div>

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
        </div>

        {/* Right column — live preview */}
        <div className="hidden flex-col overflow-y-auto border-s border-gray-100 bg-gray-100/60 p-6 lg:flex">
          <div className="mx-auto w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <InvoicePreview
              invoiceNumber={invoice?.invoice_number ?? null}
              status={invoice?.status}
              patientName={watchedPatientName ?? ""}
              doctorName={watchedDoctorName || undefined}
              issueDate={
                invoice?.issued_at ??
                invoice?.created_at ??
                new Date().toISOString()
              }
              dueDate={watchedDueDate || null}
              currency={watchedCurrency ?? "EGP"}
              items={watchedItems ?? []}
              discountType={watchedDiscountType}
              discountValue={watchedDiscountValue}
              taxAmount={invoice?.tax_amount ?? 0}
              notes={watchedNotes || null}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSaving}
        >
          {tCommon("cancel")}
        </Button>
        {isCreate ? (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={onSaveDraft}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : null}
              {t("actions.saveAsDraft")}
            </Button>
            <Button type="button" onClick={onCreateAndIssue} disabled={isSaving}>
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
  );
}
