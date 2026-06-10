import { apiAuthFetch } from "@/infrastructure/http/api";
import type { ApiResponse } from "@/common/types/api.types";
import type {
  AppendChargesPayload,
  BuildInvoiceFromChargesPayload,
  CreateInvoicePayload,
  Invoice,
  InvoiceFilters,
  Payment,
  RecordPaymentPayload,
  UpdateInvoicePayload,
} from "../types/financial.types";

// ── reads ─────────────────────────────────────────────────────────────────────

export function fetchInvoices(
  orgId: string,
  filters?: InvoiceFilters,
): Promise<ApiResponse<Invoice[]>> {
  const params = new URLSearchParams();
  if (filters?.branch_id) params.set("branch_id", filters.branch_id);
  if (filters?.patient_id) params.set("patient_id", filters.patient_id);
  if (filters?.episode_id) params.set("episode_id", filters.episode_id);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.type) params.set("type", filters.type);
  if (filters?.date_from) params.set("date_from", filters.date_from);
  if (filters?.date_to) params.set("date_to", filters.date_to);
  if (filters?.page != null) params.set("page", String(filters.page));
  if (filters?.limit != null) params.set("limit", String(filters.limit));
  const qs = params.toString();
  return apiAuthFetch<ApiResponse<Invoice[]>>(
    `/organizations/${orgId}/invoices${qs ? `?${qs}` : ""}`,
  );
}

export function fetchInvoice(orgId: string, id: string): Promise<ApiResponse<Invoice>> {
  return apiAuthFetch<ApiResponse<Invoice>>(`/organizations/${orgId}/invoices/${id}`);
}

export function fetchPayments(orgId: string, id: string): Promise<ApiResponse<Payment[]>> {
  return apiAuthFetch<ApiResponse<Payment[]>>(
    `/organizations/${orgId}/invoices/${id}/payments`,
  );
}

// ── writes ────────────────────────────────────────────────────────────────────

export function createInvoice(
  orgId: string,
  payload: CreateInvoicePayload,
): Promise<ApiResponse<Invoice>> {
  return apiAuthFetch<ApiResponse<Invoice>>(`/organizations/${orgId}/invoices`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function buildInvoiceFromCharges(
  orgId: string,
  payload: BuildInvoiceFromChargesPayload,
): Promise<ApiResponse<Invoice>> {
  return apiAuthFetch<ApiResponse<Invoice>>(
    `/organizations/${orgId}/invoices/from-charges`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function appendChargesToInvoice(
  orgId: string,
  id: string,
  payload: AppendChargesPayload,
): Promise<ApiResponse<Invoice>> {
  return apiAuthFetch<ApiResponse<Invoice>>(
    `/organizations/${orgId}/invoices/${id}/append-charges`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function updateInvoice(
  orgId: string,
  id: string,
  payload: UpdateInvoicePayload,
): Promise<ApiResponse<Invoice>> {
  return apiAuthFetch<ApiResponse<Invoice>>(`/organizations/${orgId}/invoices/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function issueInvoice(orgId: string, id: string): Promise<ApiResponse<Invoice>> {
  return apiAuthFetch<ApiResponse<Invoice>>(
    `/organizations/${orgId}/invoices/${id}/issue`,
    { method: "POST" },
  );
}

export function voidInvoice(orgId: string, id: string): Promise<ApiResponse<Invoice>> {
  return apiAuthFetch<ApiResponse<Invoice>>(
    `/organizations/${orgId}/invoices/${id}/void`,
    { method: "POST" },
  );
}

export function recordPayment(
  orgId: string,
  id: string,
  payload: RecordPaymentPayload,
): Promise<ApiResponse<Payment>> {
  return apiAuthFetch<ApiResponse<Payment>>(
    `/organizations/${orgId}/invoices/${id}/payments`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function voidPayment(
  orgId: string,
  invoiceId: string,
  paymentId: string,
): Promise<ApiResponse<Payment>> {
  return apiAuthFetch<ApiResponse<Payment>>(
    `/organizations/${orgId}/invoices/${invoiceId}/payments/${paymentId}/void`,
    { method: "POST" },
  );
}
