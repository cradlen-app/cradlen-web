"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/queryKeys";
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
        queryKey: queryKeys.financial.pricing.providerOverrides(orgId ?? "", profileId),
      });
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to delete price override"));
    },
  });
}
