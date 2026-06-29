import type {
  CashSessionStatus,
  ChargeSource,
  ChargeStatus,
  DiscountType,
  InvoiceStatus,
  InvoiceType,
  PaymentMethod,
  PaymentStatus,
  PricingSource,
  ReceiptStatus,
  RefundStatus,
  ServiceType,
} from "./financial-enums.types";

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

export type AuthorizeServicesPayload = {
  service_ids: string[];
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

