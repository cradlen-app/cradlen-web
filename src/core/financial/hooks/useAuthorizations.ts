"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { financialQueryKeys } from "@/core/financial/queryKeys";
import { getApiErrorMessage } from "@/common/errors/error";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import {
  activateProviderService,
  authorizeProviderService,
  authorizeProviderServices,
  deactivateProviderService,
  fetchProviderServices,
  revokeProviderService,
} from "../lib/pricing.api";
import type {
  AuthorizeServicePayload,
  AuthorizeServicesPayload,
} from "../types/financial.types";

/** List a provider's service authorizations. */
export function useProviderServices(profileId: string | null | undefined) {
  const orgId = useAuthContextStore((s) => s.organizationId);

  const query = useQuery({
    queryKey: financialQueryKeys.pricing.providerServices(
      orgId ?? "",
      profileId ?? "",
    ),
    queryFn: async () => {
      const res = await fetchProviderServices(orgId!, profileId!);
      return res.data;
    },
    enabled: !!orgId && !!profileId,
  });

  return {
    authorizations: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}

function useInvalidateProviderServices(profileId: string) {
  const qc = useQueryClient();
  const orgId = useAuthContextStore((s) => s.organizationId);
  return () =>
    void qc.invalidateQueries({
      queryKey: financialQueryKeys.pricing.providerServices(
        orgId ?? "",
        profileId,
      ),
    });
}

/** Authorize a provider for a service (optionally branch-scoped). */
export function useAuthorizeService(profileId: string) {
  const orgId = useAuthContextStore((s) => s.organizationId);
  const invalidate = useInvalidateProviderServices(profileId);

  return useMutation({
    mutationFn: (payload: AuthorizeServicePayload) =>
      authorizeProviderService(orgId!, profileId, payload),
    onSuccess: () => {
      invalidate();
      toast.success("Service authorized");
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to authorize service"));
    },
  });
}

/**
 * Authorize a provider for multiple services at once (shared branch/duration).
 * The success toast is left to the caller, which knows how many were created.
 */
export function useAuthorizeServices(profileId: string) {
  const orgId = useAuthContextStore((s) => s.organizationId);
  const invalidate = useInvalidateProviderServices(profileId);

  return useMutation({
    mutationFn: (payload: AuthorizeServicesPayload) =>
      authorizeProviderServices(orgId!, profileId, payload),
    onSuccess: () => {
      invalidate();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to authorize services"));
    },
  });
}

/** Revoke a provider's authorization for a service. */
export function useRevokeProviderService(profileId: string) {
  const orgId = useAuthContextStore((s) => s.organizationId);
  const invalidate = useInvalidateProviderServices(profileId);

  return useMutation({
    mutationFn: (serviceId: string) =>
      revokeProviderService(orgId!, profileId, serviceId),
    onSuccess: () => {
      invalidate();
      toast.success("Authorization revoked");
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to revoke authorization"));
    },
  });
}

/** Activate or deactivate an existing authorization. */
export function useToggleProviderServiceActive(profileId: string) {
  const orgId = useAuthContextStore((s) => s.organizationId);
  const invalidate = useInvalidateProviderServices(profileId);

  return useMutation({
    mutationFn: ({
      serviceId,
      active,
    }: {
      serviceId: string;
      active: boolean;
    }) =>
      active
        ? activateProviderService(orgId!, profileId, serviceId)
        : deactivateProviderService(orgId!, profileId, serviceId),
    onSuccess: (_data, variables) => {
      invalidate();
      toast.success(
        variables.active
          ? "Authorization activated"
          : "Authorization deactivated",
      );
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to update authorization"));
    },
  });
}
