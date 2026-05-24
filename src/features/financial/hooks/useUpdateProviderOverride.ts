"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { updateProviderOverride } from "../lib/pricing.api";
import type { UpdateProviderOverridePayload } from "../types/financial.types";

export function useUpdateProviderOverride(profileId: string) {
  const qc = useQueryClient();
  const orgId = useAuthContextStore((s) => s.organizationId);

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateProviderOverridePayload;
    }) => updateProviderOverride(orgId!, profileId, id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: queryKeys.financial.pricing.providerOverrides(orgId ?? "", profileId),
      });
    },
  });
}
