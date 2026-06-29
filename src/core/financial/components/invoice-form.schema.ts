import { z } from "zod";

/**
 * Invoice create/edit form schema, shared by `InvoiceDrawer` (owns the form),
 * `InvoiceEditForm` (renders it), and `InvoiceLineItemsEditor`. Kept in its own
 * module so those components don't have to import the type back from the drawer.
 */
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
