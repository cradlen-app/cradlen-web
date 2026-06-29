import type {
  InvoiceStatus,
  PaymentMethod,
} from "./financial-enums.types";

// ── Reporting types ─────────────────────────────────────────────────────────

export type ReportParams = {
  branch_id?: string;
  date_from?: string;
  date_to?: string;
  /**
   * Scope reports to a single provider. Sent for the own-revenue doctor view;
   * the backend enforces that a non-privileged doctor may only query their own id.
   */
  doctor_id?: string;
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

/** A single status bucket for the billing dashboard cards. Amount is a Decimal string. */
export type InvoiceStatBucket = { count: number; amount: string };

/**
 * Per-status invoice rollup powering the invoices-page stat cards. PENDING and
 * OVERDUE are derived server-side (we have no such statuses): pending = DRAFT,
 * overdue = issued/partially-paid past due_date. See the `invoice-stats` report.
 */
export type InvoiceStatsReport = {
  paid: InvoiceStatBucket;
  unpaid: InvoiceStatBucket;
  pending: InvoiceStatBucket;
  overdue: InvoiceStatBucket;
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

