import { apiAuthFetch } from "@/infrastructure/http/api";
import type { ApiResponse } from "@/common/types/api.types";
import type { ReportParams } from "../types/financial.types";

const base = (orgId: string) => `/organizations/${orgId}/financial/reports`;

function qs(params?: ReportParams): string {
  const sp = new URLSearchParams();
  if (params?.branch_id) sp.set("branch_id", params.branch_id);
  if (params?.date_from) sp.set("date_from", params.date_from);
  if (params?.date_to) sp.set("date_to", params.date_to);
  const s = sp.toString();
  return s ? `?${s}` : "";
}

/**
 * Generic report fetcher. `name` is the endpoint segment, e.g. "revenue",
 * "daily-revenue", "ar-aging". The response shape varies per report — callers
 * pass the expected type.
 */
export function fetchReport<T>(
  orgId: string,
  name: string,
  params?: ReportParams,
): Promise<ApiResponse<T>> {
  return apiAuthFetch<ApiResponse<T>>(`${base(orgId)}/${name}${qs(params)}`);
}
