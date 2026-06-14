import { apiAuthFetch } from "@/infrastructure/http/api";
import type { ApiResponse } from "@/common/types/api.types";
import type {
  CreatePaymentRequest,
  CreatePaymentResponse,
  CurrentSubscription,
  Plan,
  SubscriptionPayment,
} from "./subscriptions.types";

export function listPlans() {
  return apiAuthFetch<ApiResponse<Plan[]>>("/subscription-plans");
}

export function getCurrentSubscription(organizationId: string) {
  return apiAuthFetch<ApiResponse<CurrentSubscription>>(
    `/organizations/${organizationId}/subscription`,
  );
}

export function createPayment(
  organizationId: string,
  data: CreatePaymentRequest,
) {
  return apiAuthFetch<ApiResponse<CreatePaymentResponse>>(
    `/organizations/${organizationId}/subscription/payments`,
    { method: "POST", body: JSON.stringify(data) },
  );
}

export type ListPaymentsOptions = {
  page?: number;
  limit?: number;
  status?: string;
};

export function listPayments(
  organizationId: string,
  opts: ListPaymentsOptions = {},
) {
  const params = new URLSearchParams();
  if (opts.page) params.set("page", String(opts.page));
  if (opts.limit) params.set("limit", String(opts.limit));
  if (opts.status) params.set("status", opts.status);
  const qs = params.toString();
  return apiAuthFetch<ApiResponse<SubscriptionPayment[]>>(
    `/organizations/${organizationId}/subscription/payments${qs ? `?${qs}` : ""}`,
  );
}

export function getPayment(organizationId: string, paymentId: string) {
  return apiAuthFetch<ApiResponse<SubscriptionPayment>>(
    `/organizations/${organizationId}/subscription/payments/${paymentId}`,
  );
}

export function cancelPayment(organizationId: string, paymentId: string) {
  return apiAuthFetch<ApiResponse<SubscriptionPayment>>(
    `/organizations/${organizationId}/subscription/payments/${paymentId}/cancel`,
    { method: "POST" },
  );
}

/** Response of `POST .../payments/:id/proof/upload-url`. */
type ProofUploadUrl = {
  key: string;
  upload_url: string;
  expires_in: number;
  content_type: string;
};

/**
 * Presigned-R2 proof upload (mirrors `uploadProfileImage` in settings.api): ask
 * the backend for a presigned PUT, upload the bytes straight to R2, then confirm
 * the object key (which flips the payment to AWAITING_VERIFICATION).
 */
export async function uploadProof(
  organizationId: string,
  paymentId: string,
  file: File,
) {
  const base = `/organizations/${organizationId}/subscription/payments/${paymentId}/proof`;
  const presign = await apiAuthFetch<ApiResponse<ProofUploadUrl>>(
    `${base}/upload-url`,
    {
      method: "POST",
      body: JSON.stringify({ content_type: file.type, size_bytes: file.size }),
    },
  );

  const put = await fetch(presign.data.upload_url, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": presign.data.content_type },
  });
  if (!put.ok) throw new Error("Upload failed");

  return apiAuthFetch<ApiResponse<SubscriptionPayment>>(base, {
    method: "POST",
    body: JSON.stringify({ key: presign.data.key }),
  });
}

export function removeProof(
  organizationId: string,
  paymentId: string,
  proofId: string,
) {
  return apiAuthFetch<ApiResponse<SubscriptionPayment>>(
    `/organizations/${organizationId}/subscription/payments/${paymentId}/proof/${proofId}`,
    { method: "DELETE" },
  );
}
