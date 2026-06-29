import type {
  ChargeSource,
  DiscountType,
  InvoiceType,
  PaymentMethod,
  ServiceType,
} from "./financial-enums.types";

// ── Payload types ─────────────────────────────────────────────────────────────

export type CreateInvoiceItemPayload = {
  service_id?: string;
  description: string;
  quantity?: number;
  unit_price: number;
  discount_amount?: number;
};

export type CreateInvoicePayload = {
  branch_id: string;
  patient_id: string;
  visit_id?: string;
  assigned_doctor_id?: string;
  invoice_type?: InvoiceType;
  currency?: string;
  notes?: string;
  due_date?: string;
  discount_type?: DiscountType;
  discount_value?: number;
  items?: CreateInvoiceItemPayload[];
};

export type UpdateInvoiceItemPayload = {
  service_id?: string;
  description?: string;
  quantity?: number;
  unit_price?: number;
  discount_amount?: number;
};

export type UpdateInvoicePayload = {
  assigned_doctor_id?: string;
  notes?: string;
  due_date?: string;
  discount_type?: DiscountType;
  discount_value?: number;
  items?: UpdateInvoiceItemPayload[];
};

export type RecordPaymentPayload = {
  amount: number;
  currency?: string;
  payment_method: PaymentMethod;
  payment_date?: string;
  reference_number?: string;
  notes?: string;
};

export type CreateServicePayload = {
  code: string;
  name: string;
  description?: string;
  service_type: ServiceType;
  specialty_ids?: string[];
  category_id?: string;
};

export type UpdateServicePayload = {
  code?: string;
  name?: string;
  description?: string;
  service_type?: ServiceType;
  specialty_ids?: string[];
  category_id?: string;
};

export type CreateCategoryPayload = {
  code: string;
  name: string;
  description?: string;
};

export type UpdateCategoryPayload = {
  code?: string;
  name?: string;
  description?: string;
  is_active?: boolean;
};

export type CreatePriceListPayload = {
  branch_id?: string;
  name: string;
  currency?: string;
  is_default?: boolean;
  valid_from?: string;
  valid_to?: string;
};

export type UpdatePriceListPayload = {
  name?: string;
  /** Branch scope; null = org-wide. */
  branch_id?: string | null;
  currency?: string;
  is_default?: boolean;
  valid_from?: string;
  valid_to?: string;
};

export type CreatePriceListItemPayload = {
  service_id: string;
  unit_price: number;
};

export type UpdatePriceListItemPayload = {
  unit_price: number;
};

/** Bulk replace/upsert of price-list items (backend `PUT :id/items`). */
export type BulkPriceListItemsPayload = {
  items: CreatePriceListItemPayload[];
};

export type CreateProviderOverridePayload = {
  service_id: string;
  branch_id?: string;
  /** Backend field name is `price` (not `unit_price`). */
  price: number;
  currency?: string;
  valid_from?: string;
  valid_to?: string;
};

export type UpdateProviderOverridePayload = {
  price?: number;
  currency?: string;
  valid_from?: string;
  valid_to?: string;
};

export type CaptureChargePayload = {
  branch_id: string;
  patient_id: string;
  /** Rendering provider (Profile id). */
  profile_id: string;
  visit_id?: string;
  service_id?: string;
  description?: string;
  quantity?: number;
  /** Explicit unit price overrides price resolution and marks the charge CUSTOM. */
  unit_price?: number;
  currency?: string;
  source?: ChargeSource;
};

/** Only quantity/description may change pre-invoice; unit price stays frozen. */
export type UpdateChargePayload = {
  quantity?: number;
  description?: string;
};

export type BuildInvoiceFromChargesPayload = {
  branch_id: string;
  patient_id: string;
  /** Omit to pull in every open charge for the patient at the branch. */
  charge_ids?: string[];
  visit_id?: string;
  invoice_type?: InvoiceType;
  currency?: string;
  notes?: string;
  due_date?: string;
  discount_type?: "PERCENTAGE" | "FIXED";
  discount_value?: number;
};

/**
 * Append a patient's open (PENDING) charges to an existing issued invoice — the
 * post-issue accrual path. Omit charge_ids to pull in every open charge for the
 * invoice's patient at its branch.
 */
export type AppendChargesPayload = {
  charge_ids?: string[];
};

export type CreateRefundPayload = {
  payment_id: string;
  amount: number;
  /** Required by the backend (min length 4). */
  reason: string;
};

export type OpenCashSessionPayload = {
  branch_id: string;
  opening_float?: number;
};

export type CloseCashSessionPayload = {
  /** Physically counted cash at close. */
  counted_amount: number;
  notes?: string;
};
