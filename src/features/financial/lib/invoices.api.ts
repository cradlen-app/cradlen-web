import { apiAuthFetch } from "@/infrastructure/http/api";
import type { ApiResponse } from "@/common/types/api.types";
import type {
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
  page?: number,
  limit?: number,
): Promise<ApiResponse<Invoice[]>> {
  const params = new URLSearchParams();
  if (filters?.branchId) params.set("branchId", filters.branchId);
  if (filters?.patientId) params.set("patientId", filters.patientId);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.invoiceType) params.set("invoiceType", filters.invoiceType);
  if (filters?.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters?.dateTo) params.set("dateTo", filters.dateTo);
  if (filters?.visitId) params.set("visitId", filters.visitId);
  if (page != null) params.set("page", String(page));
  if (limit != null) params.set("limit", String(limit));
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
