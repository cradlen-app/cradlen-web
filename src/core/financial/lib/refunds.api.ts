import { apiAuthFetch } from "@/infrastructure/http/api";
import type { ApiResponse } from "@/common/types/api.types";
import type { CreateRefundPayload, Refund } from "../types/financial.types";

const base = (orgId: string) => `/organizations/${orgId}/refunds`;

export function fetchRefundsForInvoice(
  orgId: string,
  invoiceId: string,
): Promise<ApiResponse<Refund[]>> {
  return apiAuthFetch<ApiResponse<Refund[]>>(
    `${base(orgId)}?invoice_id=${invoiceId}`,
  );
}

export function createRefund(
  orgId: string,
  payload: CreateRefundPayload,
): Promise<ApiResponse<Refund>> {
  return apiAuthFetch<ApiResponse<Refund>>(base(orgId), {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function voidRefund(
  orgId: string,
  id: string,
): Promise<ApiResponse<Refund>> {
  return apiAuthFetch<ApiResponse<Refund>>(`${base(orgId)}/${id}/void`, {
    method: "POST",
  });
}
