import { apiAuthFetch } from "@/infrastructure/http/api";
import type { ApiResponse } from "@/common/types/api.types";
import type {
  AppendChargesPayload,
  BuildInvoiceFromChargesPayload,
  CreateInvoicePayload,
  Invoice,
  InvoiceFilters,
  InvoiceItem,
  Payment,
  RecordPaymentPayload,
  UpdateInvoicePayload,
} from "../types/financial.types";

// ── Decimal normalization ───────────────────────────────────────────────────
// The backend serializes Prisma Decimal columns as strings (see
// invoice-response.dto.ts), but our types declare them as `number`. Coerce at
// the boundary so arithmetic (e.g. `a + tax`) doesn't silently string-concat.

const toNum = (v: unknown): number =>
  typeof v === "number" ? v : Number(v ?? 0) || 0;

function normalizeItem(item: InvoiceItem): InvoiceItem {
  return {
    ...item,
    unit_price: toNum(item.unit_price),
    discount_amount: toNum(item.discount_amount),
    total_amount: toNum(item.total_amount),
  };
}

function normalizePayment(payment: Payment): Payment {
  return { ...payment, amount: toNum(payment.amount) };
}

function normalizeInvoice(inv: Invoice): Invoice {
  return {
    ...inv,
    subtotal: toNum(inv.subtotal),
    discount_value: inv.discount_value == null ? null : toNum(inv.discount_value),
    discount_amount: toNum(inv.discount_amount),
    tax_amount: toNum(inv.tax_amount),
    total_amount: toNum(inv.total_amount),
    paid_amount: toNum(inv.paid_amount),
    balance_due: toNum(inv.balance_due),
    items: (inv.items ?? []).map(normalizeItem),
    payments: inv.payments?.map(normalizePayment),
  };
}

// ── reads ─────────────────────────────────────────────────────────────────────

export async function fetchInvoices(
  orgId: string,
  filters?: InvoiceFilters,
): Promise<ApiResponse<Invoice[]>> {
  const params = new URLSearchParams();
  if (filters?.branch_id) params.set("branch_id", filters.branch_id);
  if (filters?.patient_id) params.set("patient_id", filters.patient_id);
  if (filters?.visit_ids?.length)
    params.set("visit_ids", filters.visit_ids.join(","));
  if (filters?.status) params.set("status", filters.status);
  if (filters?.type) params.set("type", filters.type);
  if (filters?.search) params.set("search", filters.search);
  if (filters?.date_from) params.set("date_from", filters.date_from);
  if (filters?.date_to) params.set("date_to", filters.date_to);
  if (filters?.page != null) params.set("page", String(filters.page));
  if (filters?.limit != null) params.set("limit", String(filters.limit));
  const qs = params.toString();
  const res = await apiAuthFetch<ApiResponse<Invoice[]>>(
    `/organizations/${orgId}/invoices${qs ? `?${qs}` : ""}`,
  );
  return { ...res, data: res.data.map(normalizeInvoice) };
}

export async function fetchInvoice(
  orgId: string,
  id: string,
): Promise<ApiResponse<Invoice>> {
  const res = await apiAuthFetch<ApiResponse<Invoice>>(
    `/organizations/${orgId}/invoices/${id}`,
  );
  return { ...res, data: normalizeInvoice(res.data) };
}

export async function fetchPayments(
  orgId: string,
  id: string,
): Promise<ApiResponse<Payment[]>> {
  const res = await apiAuthFetch<ApiResponse<Payment[]>>(
    `/organizations/${orgId}/invoices/${id}/payments`,
  );
  return { ...res, data: res.data.map(normalizePayment) };
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
