import { apiAuthFetch } from "@/infrastructure/http/api";
import type { ApiResponse } from "@/common/types/api.types";
import type {
  AuthorizeServicePayload,
  BulkPriceListItemsPayload,
  CreatePriceListItemPayload,
  CreatePriceListPayload,
  CreateProviderOverridePayload,
  PriceList,
  PriceListItem,
  ProviderOverride,
  ProviderServiceAuthorization,
  ResolvedPrice,
  UpdatePriceListItemPayload,
  UpdatePriceListPayload,
  UpdateProviderOverridePayload,
} from "../types/financial.types";

// ── Price lists ───────────────────────────────────────────────────────────────

export function fetchPriceLists(
  orgId: string,
  branchId?: string,
): Promise<ApiResponse<PriceList[]>> {
  const params = new URLSearchParams();
  if (branchId) params.set("branch_id", branchId);
  const qs = params.toString();
  return apiAuthFetch<ApiResponse<PriceList[]>>(
    `/organizations/${orgId}/financial/price-lists${qs ? `?${qs}` : ""}`,
  );
}

export function createPriceList(
  orgId: string,
  payload: CreatePriceListPayload,
): Promise<ApiResponse<PriceList>> {
  return apiAuthFetch<ApiResponse<PriceList>>(
    `/organizations/${orgId}/financial/price-lists`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function updatePriceList(
  orgId: string,
  id: string,
  payload: UpdatePriceListPayload,
): Promise<ApiResponse<PriceList>> {
  return apiAuthFetch<ApiResponse<PriceList>>(
    `/organizations/${orgId}/financial/price-lists/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export function deletePriceList(orgId: string, id: string): Promise<void> {
  return apiAuthFetch<void>(`/organizations/${orgId}/financial/price-lists/${id}`, {
    method: "DELETE",
  });
}

export function setDefaultPriceList(
  orgId: string,
  id: string,
): Promise<ApiResponse<PriceList>> {
  return apiAuthFetch<ApiResponse<PriceList>>(
    `/organizations/${orgId}/financial/price-lists/${id}/set-default`,
    { method: "POST" },
  );
}

export function activatePriceList(
  orgId: string,
  id: string,
): Promise<ApiResponse<PriceList>> {
  return apiAuthFetch<ApiResponse<PriceList>>(
    `/organizations/${orgId}/financial/price-lists/${id}/activate`,
    { method: "POST" },
  );
}

export function deactivatePriceList(
  orgId: string,
  id: string,
): Promise<ApiResponse<PriceList>> {
  return apiAuthFetch<ApiResponse<PriceList>>(
    `/organizations/${orgId}/financial/price-lists/${id}/deactivate`,
    { method: "POST" },
  );
}

/** Bulk replace: the price list's items become exactly this set. */
export function setPriceListItems(
  orgId: string,
  priceListId: string,
  payload: BulkPriceListItemsPayload,
): Promise<ApiResponse<PriceListItem[]>> {
  return apiAuthFetch<ApiResponse<PriceListItem[]>>(
    `/organizations/${orgId}/financial/price-lists/${priceListId}/items`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );
}

// ── Price list items ──────────────────────────────────────────────────────────

export function fetchPriceListItems(
  orgId: string,
  priceListId: string,
): Promise<ApiResponse<PriceListItem[]>> {
  return apiAuthFetch<ApiResponse<PriceListItem[]>>(
    `/organizations/${orgId}/financial/price-lists/${priceListId}/items`,
  );
}

export function addPriceListItem(
  orgId: string,
  priceListId: string,
  payload: CreatePriceListItemPayload,
): Promise<ApiResponse<PriceListItem>> {
  return apiAuthFetch<ApiResponse<PriceListItem>>(
    `/organizations/${orgId}/financial/price-lists/${priceListId}/items`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function updatePriceListItem(
  orgId: string,
  priceListId: string,
  itemId: string,
  payload: UpdatePriceListItemPayload,
): Promise<ApiResponse<PriceListItem>> {
  return apiAuthFetch<ApiResponse<PriceListItem>>(
    `/organizations/${orgId}/financial/price-lists/${priceListId}/items/${itemId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export function removePriceListItem(
  orgId: string,
  priceListId: string,
  itemId: string,
): Promise<void> {
  return apiAuthFetch<void>(
    `/organizations/${orgId}/financial/price-lists/${priceListId}/items/${itemId}`,
    { method: "DELETE" },
  );
}

// ── Price resolution ──────────────────────────────────────────────────────────

export function resolvePrice(
  orgId: string,
  serviceId: string,
  branchId: string,
  profileId?: string,
): Promise<ApiResponse<ResolvedPrice>> {
  const params = new URLSearchParams({ serviceId, branchId });
  if (profileId) params.set("profileId", profileId);
  return apiAuthFetch<ApiResponse<ResolvedPrice>>(
    `/organizations/${orgId}/financial/resolve-price?${params.toString()}`,
  );
}

// ── Provider overrides ────────────────────────────────────────────────────────

export function fetchProviderOverrides(
  orgId: string,
  profileId: string,
): Promise<ApiResponse<ProviderOverride[]>> {
  return apiAuthFetch<ApiResponse<ProviderOverride[]>>(
    `/organizations/${orgId}/providers/${profileId}/price-overrides`,
  );
}

export function createProviderOverride(
  orgId: string,
  profileId: string,
  payload: CreateProviderOverridePayload,
): Promise<ApiResponse<ProviderOverride>> {
  return apiAuthFetch<ApiResponse<ProviderOverride>>(
    `/organizations/${orgId}/providers/${profileId}/price-overrides`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function updateProviderOverride(
  orgId: string,
  profileId: string,
  id: string,
  payload: UpdateProviderOverridePayload,
): Promise<ApiResponse<ProviderOverride>> {
  return apiAuthFetch<ApiResponse<ProviderOverride>>(
    `/organizations/${orgId}/providers/${profileId}/price-overrides/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export function deleteProviderOverride(
  orgId: string,
  profileId: string,
  id: string,
): Promise<void> {
  return apiAuthFetch<void>(
    `/organizations/${orgId}/providers/${profileId}/price-overrides/${id}`,
    { method: "DELETE" },
  );
}

// ── Provider services (authorizations) ────────────────────────────────────────

export function fetchProviderServices(
  orgId: string,
  profileId: string,
): Promise<ApiResponse<ProviderServiceAuthorization[]>> {
  return apiAuthFetch<ApiResponse<ProviderServiceAuthorization[]>>(
    `/organizations/${orgId}/providers/${profileId}/services`,
  );
}

export function authorizeProviderService(
  orgId: string,
  profileId: string,
  payload: AuthorizeServicePayload,
): Promise<ApiResponse<ProviderServiceAuthorization>> {
  return apiAuthFetch<ApiResponse<ProviderServiceAuthorization>>(
    `/organizations/${orgId}/providers/${profileId}/services`,
    { method: "POST", body: JSON.stringify(payload) },
  );
}

export function activateProviderService(
  orgId: string,
  profileId: string,
  serviceId: string,
): Promise<ApiResponse<ProviderServiceAuthorization>> {
  return apiAuthFetch<ApiResponse<ProviderServiceAuthorization>>(
    `/organizations/${orgId}/providers/${profileId}/services/${serviceId}/activate`,
    { method: "POST" },
  );
}

export function deactivateProviderService(
  orgId: string,
  profileId: string,
  serviceId: string,
): Promise<ApiResponse<ProviderServiceAuthorization>> {
  return apiAuthFetch<ApiResponse<ProviderServiceAuthorization>>(
    `/organizations/${orgId}/providers/${profileId}/services/${serviceId}/deactivate`,
    { method: "POST" },
  );
}

export function revokeProviderService(
  orgId: string,
  profileId: string,
  serviceId: string,
): Promise<void> {
  return apiAuthFetch<void>(
    `/organizations/${orgId}/providers/${profileId}/services/${serviceId}`,
    { method: "DELETE" },
  );
}
