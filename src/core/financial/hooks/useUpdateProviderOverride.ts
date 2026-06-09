"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { financialQueryKeys } from "@/core/financial/queryKeys";
import { getApiErrorMessage } from "@/common/errors/error";
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
        queryKey: financialQueryKeys.pricing.providerOverrides(orgId ?? "", profileId),
      });
      toast.success("Price override updated");
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to update price override"));
    },
  });
}
