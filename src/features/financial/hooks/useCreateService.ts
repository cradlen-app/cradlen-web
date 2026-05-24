"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/queryKeys";
import { getApiErrorMessage } from "@/common/errors/error";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { createService } from "../lib/services.api";
import type { CreateServicePayload } from "../types/financial.types";

export function useCreateService() {
  const qc = useQueryClient();
  const orgId = useAuthContextStore((s) => s.organizationId);

  return useMutation({
    mutationFn: (payload: CreateServicePayload) => createService(orgId!, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.financial.services.all() });
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to create service"));
    },
  });
}
