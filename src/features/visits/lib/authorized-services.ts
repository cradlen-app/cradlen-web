import type {
  ProviderServiceAuthorization,
  Service,
} from "@/core/financial/api";

export type AuthorizedServiceOption = { id: string; name: string };

/**
 * The billable services the assigned doctor may deliver at this branch — used to
 * populate the service picker at booking. Mirrors the backend's
 * active-ProviderService check: an authorization counts when it's active and
 * either branch-scoped to this branch or org-wide (`branch_id === null`).
 * Deduped by service, labelled from the authorization's embedded service (or the
 * catalog as a fallback).
 */
export function filterAuthorizedServices(
  authorizations: ProviderServiceAuthorization[],
  services: Service[],
  branchId: string | null | undefined,
): AuthorizedServiceOption[] {
  const nameById = new Map(services.map((s) => [s.id, s.name]));
  const seen = new Set<string>();
  const list: AuthorizedServiceOption[] = [];
  for (const a of authorizations) {
    if (!a.is_active) continue;
    if (a.branch_id !== null && a.branch_id !== branchId) continue;
    if (seen.has(a.service_id)) continue;
    seen.add(a.service_id);
    list.push({
      id: a.service_id,
      name: a.service?.name ?? nameById.get(a.service_id) ?? a.service_id,
    });
  }
  return list;
}
