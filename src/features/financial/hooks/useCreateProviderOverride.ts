"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { createProviderOverride } from "../lib/pricing.api";
import type { CreateProviderOverridePayload } from "../types/financial.types";

export function useCreateProviderOverride(profileId: string) {
  const qc = useQueryClient();
  const orgId = useAuthContextStore((s) => s.organizationId);

  return useMutation({
    mutationFn: (payload: CreateProviderOverridePayload) =>
      createProviderOverride(orgId!, profileId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: queryKeys.financial.pricing.providerOverrides(orgId ?? "", profileId),
      });
    },
  });
}
