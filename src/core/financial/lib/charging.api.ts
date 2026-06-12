import { apiAuthFetch } from "@/infrastructure/http/api";
import type { ApiResponse } from "@/common/types/api.types";
import type {
  CaptureChargePayload,
  Charge,
  ChargeStatus,
  UpdateChargePayload,
} from "../types/financial.types";

const base = (orgId: string) => `/organizations/${orgId}/financial/charges`;

// ── Decimal normalization ───────────────────────────────────────────────────
// The backend serializes Prisma Decimal columns as strings, but our types
// declare `unit_price` as `number`. Coerce at the boundary (mirrors
// invoices.api.ts) so the UI never does `Number(charge.unit_price)` at a
// display site.

const toNum = (v: unknown): number =>
  typeof v === "number" ? v : Number(v ?? 0) || 0;

function normalizeCharge(charge: Charge): Charge {
  return { ...charge, unit_price: toNum(charge.unit_price) };
}

// ── reads ─────────────────────────────────────────────────────────────────────

export function fetchCharges(
  orgId: string,
  opts?: {
    patient_id?: string;
    visit_id?: string;
    branch_id?: string;
    status?: ChargeStatus;
    page?: number;
    limit?: number;
  },
): Promise<ApiResponse<Charge[]>> {
  const params = new URLSearchParams();
  if (opts?.patient_id) params.set("patient_id", opts.patient_id);
  if (opts?.visit_id) params.set("visit_id", opts.visit_id);
  if (opts?.branch_id) params.set("branch_id", opts.branch_id);
  if (opts?.status) params.set("status", opts.status);
  if (opts?.page != null) params.set("page", String(opts.page));
  if (opts?.limit != null) params.set("limit", String(opts.limit));
  const qs = params.toString();
  return apiAuthFetch<ApiResponse<Charge[]>>(
    `${base(orgId)}${qs ? `?${qs}` : ""}`,
  ).then((res) => ({ ...res, data: res.data.map(normalizeCharge) }));
}

/** Backend `getByVisit` returns `{ charges, summary }`, not a flat array. */
export type VisitChargesResult = {
  charges: Charge[];
  summary: {
    currency: string;
    pending_total: string;
    charge_count: number;
  };
};

export function fetchVisitCharges(
  orgId: string,
  visitId: string,
): Promise<ApiResponse<VisitChargesResult>> {
  return apiAuthFetch<ApiResponse<VisitChargesResult>>(
    `${base(orgId)}/visit/${visitId}`,
  ).then((res) => ({
    ...res,
    data: { ...res.data, charges: res.data.charges.map(normalizeCharge) },
  }));
}

// ── writes ────────────────────────────────────────────────────────────────────

export function captureCharge(
  orgId: string,
  payload: CaptureChargePayload,
): Promise<ApiResponse<Charge>> {
  return apiAuthFetch<ApiResponse<Charge>>(base(orgId), {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCharge(
  orgId: string,
  id: string,
  payload: UpdateChargePayload,
): Promise<ApiResponse<Charge>> {
  return apiAuthFetch<ApiResponse<Charge>>(`${base(orgId)}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function cancelCharge(
  orgId: string,
  id: string,
): Promise<ApiResponse<Charge>> {
  return apiAuthFetch<ApiResponse<Charge>>(`${base(orgId)}/${id}/cancel`, {
    method: "POST",
  });
}

export function voidCharge(
  orgId: string,
  id: string,
): Promise<ApiResponse<Charge>> {
  return apiAuthFetch<ApiResponse<Charge>>(`${base(orgId)}/${id}/void`, {
    method: "POST",
  });
}

export function writeOffCharge(
  orgId: string,
  id: string,
): Promise<ApiResponse<Charge>> {
  return apiAuthFetch<ApiResponse<Charge>>(`${base(orgId)}/${id}/write-off`, {
    method: "POST",
  });
}
