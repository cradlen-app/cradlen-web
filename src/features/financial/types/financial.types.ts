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

export type InvoiceItem = {
  id: string;
  invoice_id: string;
  service_id: string;
  service_name: string;
  quantity: number;
  unit_price: number;
  discount?: number | null;
  total: number;
  pricing_source: PricingSource;
  created_at: string;
  updated_at: string;
};

export type Invoice = {
  id: string;
  organization_id: string;
  branch_id: string;
  patient_id?: string | null;
  visit_id?: string | null;
  invoice_number: string;
  invoice_type: InvoiceType;
  status: InvoiceStatus;
  subtotal: number;
  discount?: number | null;
  tax?: number | null;
  total: number;
  amount_paid: number;
  amount_due: number;
  notes?: string | null;
  issued_at?: string | null;
  due_date?: string | null;
  items: InvoiceItem[];
  created_at: string;
  updated_at: string;
};

export type Payment = {
  id: string;
  invoice_id: string;
  organization_id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  reference?: string | null;
  notes?: string | null;
  paid_at: string;
  created_at: string;
  updated_at: string;
};

export type ServiceSpecialty = {
  id: string;
  code: string;
  name: string;
};

export type Service = {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  description?: string | null;
  service_type: ServiceType;
  base_price: number;
  is_active: boolean;
  specialties?: ServiceSpecialty[];
  created_at: string;
  updated_at: string;
};

export type PriceListItem = {
  id: string;
  price_list_id: string;
  service_id: string;
  service_name: string;
  price: number;
  created_at: string;
  updated_at: string;
};

export type PriceList = {
  id: string;
  organization_id: string;
  branch_id?: string | null;
  name: string;
  description?: string | null;
  is_default: boolean;
  is_active: boolean;
  items?: PriceListItem[];
  created_at: string;
  updated_at: string;
};

export type ProviderOverride = {
  id: string;
  organization_id: string;
  profile_id: string;
  service_id: string;
  service_name: string;
  price: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
};

export type ResolvedPrice = {
  service_id: string;
  service_name: string;
  price: number;
  source: PricingSource;
  price_list_id?: string | null;
  override_id?: string | null;
};

// ── Filter types ──────────────────────────────────────────────────────────────

export type InvoiceFilters = {
  branchId?: string;
  patientId?: string;
  status?: InvoiceStatus;
  invoiceType?: InvoiceType;
  dateFrom?: string;
  dateTo?: string;
  visitId?: string;
};

// ── Payload types ─────────────────────────────────────────────────────────────

export type CreateInvoiceItemPayload = {
  service_id: string;
  quantity: number;
  unit_price?: number;
  discount?: number;
};

export type CreateInvoicePayload = {
  branch_id: string;
  patient_id?: string;
  visit_id?: string;
  invoice_type?: InvoiceType;
  discount?: number;
  tax?: number;
  notes?: string;
  due_date?: string;
  items: CreateInvoiceItemPayload[];
};

export type UpdateInvoiceItemPayload = {
  service_id?: string;
  quantity?: number;
  unit_price?: number;
  discount?: number;
};

export type UpdateInvoicePayload = {
  invoice_type?: InvoiceType;
  discount?: number;
  tax?: number;
  notes?: string;
  due_date?: string;
  items?: UpdateInvoiceItemPayload[];
};

export type RecordPaymentPayload = {
  amount: number;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
  paid_at?: string;
};

export type CreateServicePayload = {
  code: string;
  name: string;
  description?: string;
  service_type: ServiceType;
  base_price: number;
  is_active?: boolean;
  specialty_codes?: string[];
};

export type UpdateServicePayload = {
  name?: string;
  description?: string;
  service_type?: ServiceType;
  base_price?: number;
  is_active?: boolean;
  specialty_codes?: string[];
};

export type CreatePriceListPayload = {
  branch_id?: string;
  name: string;
  description?: string;
  is_default?: boolean;
  is_active?: boolean;
};

export type UpdatePriceListPayload = {
  name?: string;
  description?: string;
  is_default?: boolean;
  is_active?: boolean;
};

export type CreatePriceListItemPayload = {
  service_id: string;
  price: number;
};

export type UpdatePriceListItemPayload = {
  price?: number;
};

export type CreateProviderOverridePayload = {
  service_id: string;
  price: number;
  notes?: string;
};

export type UpdateProviderOverridePayload = {
  price?: number;
  notes?: string;
};
