import { apiAuthFetch } from "@/infrastructure/http/api";
import type { ApiResponse } from "@/common/types/api.types";
import type { Receipt, ReceiptPrint } from "../types/financial.types";

const base = (orgId: string) => `/organizations/${orgId}/receipts`;

export function fetchReceiptsForInvoice(
  orgId: string,
  invoiceId: string,
): Promise<ApiResponse<Receipt[]>> {
  return apiAuthFetch<ApiResponse<Receipt[]>>(
    `${base(orgId)}?invoice_id=${invoiceId}`,
  );
}

export function fetchReceipt(
  orgId: string,
  id: string,
): Promise<ApiResponse<Receipt>> {
  return apiAuthFetch<ApiResponse<Receipt>>(`${base(orgId)}/${id}`);
}

export function fetchReceiptPrint(
  orgId: string,
  id: string,
): Promise<ApiResponse<ReceiptPrint>> {
  return apiAuthFetch<ApiResponse<ReceiptPrint>>(`${base(orgId)}/${id}/print`);
}
