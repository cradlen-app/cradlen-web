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
 * `include`s the relation. Backend currently does NOT include patient/doctor
 * on invoice responses (see `invoices.service.ts` findOne), so these are
 * left optional and callers should fall back to the corresponding *_id.
 * TODO: verify shape if backend starts including these relations.
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
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
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
  /** Backend `type` query param (maps to `InvoiceType`). */
  type?: InvoiceType;
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
  assigned_doctor_id?: string;
  invoice_type?: InvoiceType;
  currency?: string;
  notes?: string;
  due_date?: string;
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
  discount_amount?: number;
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
};

export type UpdateServicePayload = {
  code?: string;
  name?: string;
  description?: string;
  service_type?: ServiceType;
  specialty_ids?: string[];
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
