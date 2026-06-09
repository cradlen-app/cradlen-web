import { apiAuthFetch } from "@/infrastructure/http/api";
import type { ApiResponse } from "@/common/types/api.types";
import type {
  CashSession,
  CashSessionStatus,
  CloseCashSessionPayload,
  OpenCashSessionPayload,
} from "../types/financial.types";

const base = (orgId: string) =>
  `/organizations/${orgId}/financial/cash-sessions`;

// ── reads ─────────────────────────────────────────────────────────────────────

export function fetchCashSessions(
  orgId: string,
  opts?: {
    branch_id?: string;
    status?: CashSessionStatus;
    page?: number;
    limit?: number;
  },
): Promise<ApiResponse<CashSession[]>> {
  const params = new URLSearchParams();
  if (opts?.branch_id) params.set("branch_id", opts.branch_id);
  if (opts?.status) params.set("status", opts.status);
  if (opts?.page != null) params.set("page", String(opts.page));
  if (opts?.limit != null) params.set("limit", String(opts.limit));
  const qs = params.toString();
  return apiAuthFetch<ApiResponse<CashSession[]>>(
    `${base(orgId)}${qs ? `?${qs}` : ""}`,
  );
}

export function fetchCurrentCashSession(
  orgId: string,
  branchId: string,
): Promise<ApiResponse<CashSession | null>> {
  return apiAuthFetch<ApiResponse<CashSession | null>>(
    `${base(orgId)}/current?branch_id=${branchId}`,
  );
}

export function fetchCashSession(
  orgId: string,
  id: string,
): Promise<ApiResponse<CashSession>> {
  return apiAuthFetch<ApiResponse<CashSession>>(`${base(orgId)}/${id}`);
}

// ── writes ────────────────────────────────────────────────────────────────────

export function openCashSession(
  orgId: string,
  payload: OpenCashSessionPayload,
): Promise<ApiResponse<CashSession>> {
  return apiAuthFetch<ApiResponse<CashSession>>(base(orgId), {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function closeCashSession(
  orgId: string,
  id: string,
  payload: CloseCashSessionPayload,
): Promise<ApiResponse<CashSession>> {
  return apiAuthFetch<ApiResponse<CashSession>>(`${base(orgId)}/${id}/close`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function reconcileCashSession(
  orgId: string,
  id: string,
): Promise<ApiResponse<CashSession>> {
  return apiAuthFetch<ApiResponse<CashSession>>(
    `${base(orgId)}/${id}/reconcile`,
    { method: "POST" },
  );
}
