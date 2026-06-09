"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { financialQueryKeys } from "@/core/financial/queryKeys";
import { getApiErrorMessage } from "@/common/errors/error";
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
        queryKey: financialQueryKeys.pricing.providerOverrides(orgId ?? "", profileId),
      });
      toast.success("Price override created");
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to create price override"));
    },
  });
}
