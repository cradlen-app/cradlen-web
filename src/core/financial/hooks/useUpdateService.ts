"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { financialQueryKeys } from "@/core/financial/queryKeys";
import { getApiErrorMessage } from "@/common/errors/error";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { updateService } from "../lib/services.api";
import type { UpdateServicePayload } from "../types/financial.types";

export function useUpdateService() {
  const qc = useQueryClient();
  const orgId = useAuthContextStore((s) => s.organizationId);

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateServicePayload }) =>
      updateService(orgId!, id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: financialQueryKeys.services.all() });
      toast.success("Service updated");
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to update service"));
    },
  });
}
