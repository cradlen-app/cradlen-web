import type {
  InvoiceStatus,
  InvoiceType,
  ServiceType,
} from "./financial-enums.types";

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
  /** Filter invoices by a set of visits (encounters) — used by the billing queue. */
  visit_ids?: string[];
  /** Backend `type` query param (maps to `InvoiceType`). */
  type?: InvoiceType;
  /** Free-text search across invoice number and patient name. */
  search?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
};

