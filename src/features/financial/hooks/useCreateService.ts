"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
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
  });
}
