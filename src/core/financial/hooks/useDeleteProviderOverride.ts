"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { financialQueryKeys } from "@/core/financial/queryKeys";
import { getApiErrorMessage } from "@/common/errors/error";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { deleteProviderOverride } from "../lib/pricing.api";

export function useDeleteProviderOverride(profileId: string) {
  const qc = useQueryClient();
  const orgId = useAuthContextStore((s) => s.organizationId);

  return useMutation({
    mutationFn: (id: string) => deleteProviderOverride(orgId!, profileId, id),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: financialQueryKeys.pricing.providerOverrides(orgId ?? "", profileId),
      });
      toast.success("Price override deleted");
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to delete price override"));
    },
  });
}
