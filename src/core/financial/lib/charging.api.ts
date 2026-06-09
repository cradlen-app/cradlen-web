import { apiAuthFetch } from "@/infrastructure/http/api";
import type { ApiResponse } from "@/common/types/api.types";
import type {
  CaptureChargePayload,
  Charge,
  ChargeStatus,
  UpdateChargePayload,
} from "../types/financial.types";

const base = (orgId: string) => `/organizations/${orgId}/financial/charges`;

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
  return apiAuthFetch<ApiResponse<Charge[]>>(`${base(orgId)}${qs ? `?${qs}` : ""}`);
}

export function fetchVisitCharges(
  orgId: string,
  visitId: string,
): Promise<ApiResponse<Charge[]>> {
  return apiAuthFetch<ApiResponse<Charge[]>>(`${base(orgId)}/visit/${visitId}`);
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
