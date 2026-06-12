// ── Enums ─────────────────────────────────────────────────────────────────────

export type InvoiceStatus =
  | "DRAFT"
  | "ISSUED"
  | "PARTIALLY_PAID"
  | "PAID"
  | "VOID"
  | "REFUNDED";

export type PaymentStatus =
  | "PENDING"
  | "COMPLETED"
  | "FAILED"
  | "REFUNDED"
  | "VOID";

export type PaymentMethod =
  | "CASH"
  | "CARD"
  | "BANK_TRANSFER"
  | "INSURANCE"
  | "OTHER";

export type ServiceType =
  | "CONSULTATION"
  | "PROCEDURE"
  | "LAB_TEST"
  | "IMAGING"
  | "ADMINISTRATIVE"
  | "OTHER";

export type PricingSource =
  | "PROVIDER_OVERRIDE"
  | "BRANCH_OVERRIDE"
  | "ORG_PRICE_LIST"
  | "CUSTOM";

export type InvoiceType =
  | "STANDARD"
  | "FOLLOWUP"
  | "PROFORMA"
  | "INSURANCE"
  | "REFUND";

export type DiscountType = "PERCENTAGE" | "FIXED";

export type ChargeStatus = "PENDING" | "INVOICED" | "VOID" | "WRITTEN_OFF";

export type ChargeSource = "DOCTOR" | "RECEPTION" | "SYSTEM";

export type RefundStatus = "PENDING" | "COMPLETED" | "FAILED" | "VOID";

export type ReceiptStatus = "ISSUED" | "VOID";

export type CashSessionStatus = "OPEN" | "CLOSED" | "RECONCILED";

// ── Domain types ──────────────────────────────────────────────────────────────

/**
 * Minimal nested service shape returned by the backend when the API includes
 * `{ service: { id, name, code, service_type } }`. Used by PriceListItem and
 * ProviderOverride responses.
 */
export type EmbeddedService = {
  id: string;
  name: string;
  code: string;
  service_type: ServiceType;
};

export type InvoiceItem = {
  id: string;
  invoice_id: string;
  service_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  currency: string;
  discount_amount: number;
  total_amount: number;
  pricing_source: PricingSource;
  created_at: string;
  updated_at: string;
};

/**
 * Optional nested person shape — present only when the backend explicitly
 * `include`s the relation. The invoicing endpoints include `patient`
 * ({ id, full_name }) on both the list (findAll) and detail (findOne)
 * responses; `doctor` is flattened onto the detail response. These stay
 * optional so callers can still fall back to the corresponding *_id.
 */
export type EmbeddedPerson = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
};

export type Invoice = {
  id: string;
  organization_id: string;
  branch_id: string;
  patient_id: string;
  visit_id: string | null;
  /** Clinical case (episode) this invoice bills; groups multi-visit procedures. */
  episode_id: string | null;
  assigned_doctor_id: string | null;
  invoice_number: string;
  invoice_type: InvoiceType;
  status: InvoiceStatus;
  subtotal: number;
  discount_type: DiscountType | null;
  discount_value: number | null;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_due: number;
  currency: string;
  notes: string | null;
  issued_at: string | null;
  due_date: string | null;
  created_by_id: string;
  items: InvoiceItem[];
  payments?: Payment[];
  /** Optional — backend may include this in future responses. */
  patient?: EmbeddedPerson | null;
  /** Optional — backend may include this in future responses. */
  doctor?: EmbeddedPerson | null;
  created_at: string;
  updated_at: string;
};

export type Payment = {
  id: string;
  invoice_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method: PaymentMethod;
  payment_date: string;
  reference_number: string | null;
  notes: string | null;
  recorded_by_id: string;
  /** Set when the payment was collected as part of a cash session. */
  cash_session_id?: string | null;
  /** Optional — backend may include this in future responses. */
  recorded_by?: EmbeddedPerson | null;
  created_at: string;
  updated_at: string;
};

export type Service = {
  id: string;
  organization_id: string | null;
  code: string;
  name: string;
  description: string | null;
  service_type: ServiceType;
  is_active: boolean;
  /** Backend `ServiceResponseDto` returns `specialty_ids: string[]` (flat). */
  specialty_ids: string[];
  /** Optional category linkage (backend catalog categories). */
  category_id?: string | null;
  /** Embedded category from `ServiceResponseDto` (or null). */
  category?: { id: string; code: string; name: string } | null;
  created_at: string;
  updated_at: string;
};

/** A provider (Profile) authorized to deliver a service (optionally branch-scoped). */
export type ProviderServiceAuthorization = {
  id: string;
  profile_id: string;
  service_id: string;
  organization_id: string;
  branch_id: string | null;
  duration_minutes: number | null;
  is_active: boolean;
  service?: {
    id: string;
    name: string;
    code: string;
    service_type: ServiceType;
  } | null;
  created_at: string;
  updated_at: string;
};

export type AuthorizeServicePayload = {
  service_id: string;
  branch_id?: string;
  duration_minutes?: number;
};

export type ServiceCategory = {
  id: string;
  organization_id: string | null;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type PriceListItem = {
  id: string;
  price_list_id: string;
  service_id: string;
  unit_price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  /** Included by backend price-lists.service via `include: { service: { ... } }`. */
  service?: EmbeddedService;
};

export type PriceList = {
  id: string;
  organization_id: string;
  branch_id: string | null;
  name: string;
  currency: string;
  is_default: boolean;
  is_active: boolean;
  valid_from: string | null;
  valid_to: string | null;
  items?: PriceListItem[];
  created_at: string;
  updated_at: string;
};

export type ProviderOverride = {
  id: string;
  profile_id: string;
  organization_id: string;
  branch_id: string | null;
  service_id: string;
  price: number;
  currency: string;
  valid_from: string | null;
  valid_to: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  /** Included by backend provider-services.service via `include: { service: { ... } }`. */
  service?: EmbeddedService;
};

export type ProviderService = {
  id: string;
  profile_id: string;
  organization_id: string;
  service_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  service?: EmbeddedService;
};

export type Charge = {
  id: string;
  organization_id: string;
  branch_id: string;
  patient_id: string;
  visit_id: string | null;
  profile_id: string;
  service_id: string | null;
  description: string;
  quantity: number;
  /** Backend serializes the Decimal as a string; normalized to a number at the
   *  charging.api.ts boundary (see normalizeCharge). */
  unit_price: number;
  currency: string;
  pricing_source: PricingSource;
  source: ChargeSource;
  status: ChargeStatus;
  captured_by_id: string;
  captured_at: string;
  created_at: string;
  updated_at: string;
};

/** A refund against a completed payment. Monetary columns serialize as strings. */
export type Refund = {
  id: string;
  payment_id: string;
  amount: string;
  reason: string;
  status: RefundStatus;
  refunded_by_id: string;
  refunded_at: string;
  created_at: string;
};

/** A proof-of-payment receipt row. Monetary columns serialize as strings. */
export type Receipt = {
  id: string;
  receipt_number: string;
  payment_id: string;
  invoice_id: string;
  patient_id: string;
  amount: string;
  currency: string;
  payment_method: PaymentMethod;
  /** Invoice balance after this payment. */
  balance_after: string;
  status: ReceiptStatus;
  issued_by_id: string;
  issued_at: string;
};

/** Printable receipt aggregate — everything needed to render a receipt. */
export type ReceiptPrint = {
  receipt_number: string;
  issued_at: string;
  status: ReceiptStatus;
  currency: string;
  balance_after: string;
  organization: { id: string; name: string; logo_object_key: string | null };
  branch: {
    id: string;
    name: string;
    address: string;
    city: string;
    governorate: string;
  };
  patient: { id: string; full_name: string; phone_number: string };
  invoice: { id: string; invoice_number: string; total_amount: string };
  payment: {
    id: string;
    amount: string;
    payment_method: PaymentMethod;
    payment_date: string;
  };
  issued_by: { id: string; name: string };
};

/** Live drawer state for an OPEN session. Monetary values are strings. */
export type CashDrawerSummary = {
  collected: string;
  payment_count: number;
  expected_so_far: string;
};

/** A cash drawer session. Monetary columns serialize as strings. */
export type CashSession = {
  id: string;
  organization_id: string;
  branch_id: string;
  profile_id: string;
  opening_float: string;
  opened_by_id: string;
  opened_at: string;
  closed_by_id: string | null;
  closed_at: string | null;
  expected_amount: string | null;
  counted_amount: string | null;
  variance: string | null;
  status: CashSessionStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  /** Present only for OPEN sessions. */
  summary?: CashDrawerSummary;
};

/**
 * Response from GET /organizations/:orgId/financial/resolve-price.
 *
 * Backend `ResolvedPrice` returns ONLY `{ price, currency, source }`. The
 * service_id / service_name / price_list_id / override_id fields were never
 * present on the wire — callers should derive them from the request input or
 * a separate service lookup.
 */
export type ResolvedPrice = {
  price: number;
  currency: string;
  source: PricingSource;
};

// ── Reporting types ─────────────────────────────────────────────────────────

export type ReportParams = {
  branch_id?: string;
  date_from?: string;
  date_to?: string;
};

/** Untyped summary reports (revenue, ar-aging, collections, write-offs). */
export type ReportSummary = Record<string, unknown>;

export type DailyRevenueRow = {
  date: string;
  invoiced: string;
  collected: string;
  invoice_count: number;
};
export type DailyRevenueReport = { rows: DailyRevenueRow[] };

export type RevenueByServiceRow = {
  service_id: string | null;
  service_name: string;
  total: string;
  line_count: number;
};
export type RevenueByServiceReport = {
  by_service: RevenueByServiceRow[];
  total: string;
};

export type RevenueByDoctorRow = {
  profile_id: string | null;
  doctor_name: string;
  total: string;
  invoice_count: number;
};
export type RevenueByDoctorReport = {
  by_doctor: RevenueByDoctorRow[];
  total: string;
};

export type RevenueByBranchRow = {
  branch_id: string | null;
  branch_name: string;
  invoice_count: number;
  billed: string;
  collected: string;
  outstanding: string;
};
export type RevenueByBranchReport = {
  by_branch: RevenueByBranchRow[];
  total: string;
};

export type OutstandingInvoiceRow = {
  id: string;
  invoice_number: string;
  patient_id: string;
  patient_name: string;
  doctor_name: string | null;
  status: InvoiceStatus;
  total_amount: string;
  paid_amount: string;
  balance_due: string;
  issued_at: string | null;
  due_date: string | null;
  last_payment_date: string | null;
  age_days: number;
  aging_bucket: string;
};
export type OutstandingInvoicesReport = {
  invoices: OutstandingInvoiceRow[];
  total_outstanding: string;
  count: number;
};

export type RevenueSummaryReport = {
  total_invoiced: string;
  total_collected: string;
  outstanding: string;
  invoice_count: number;
};

export type ArAgingReport = {
  buckets: {
    current: string;
    d1_30: string;
    d31_60: string;
    d61_90: string;
    d90_plus: string;
  };
  total_outstanding: string;
};

export type CollectionsByMethodRow = {
  payment_method: PaymentMethod;
  total: string;
  count: number;
};
export type CollectionsByStaffRow = {
  profile_id: string | null;
  staff_name: string;
  total: string;
  count: number;
};
export type CollectionsReport = {
  by_method: CollectionsByMethodRow[];
  by_staff: CollectionsByStaffRow[];
  total: string;
};

export type PaymentsByMethodRow = {
  payment_method: PaymentMethod;
  total: string;
  count: number;
};
export type PaymentsByMethodReport = {
  by_method: PaymentsByMethodRow[];
  total: string;
};

// ── Filter types ──────────────────────────────────────────────────────────────

export type ServiceFilters = {
  service_type?: ServiceType;
  specialty_id?: string;
  /** Backend `active` query param (string). */
  active?: boolean;
  page?: number;
  limit?: number;
};

export type InvoiceFilters = {
  status?: InvoiceStatus;
  patient_id?: string;
  branch_id?: string;
  /** Filter invoices by clinical case (episode). */
  episode_id?: string;
  /** Backend `type` query param (maps to `InvoiceType`). */
  type?: InvoiceType;
  /** Free-text search across invoice number and patient name. */
  search?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
};

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
  episode_id?: string;
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
  /** Clinical case (episode) this invoice bills; derived from the visit when omitted. */
  episode_id?: string;
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
