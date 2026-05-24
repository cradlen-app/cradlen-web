"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
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
      void qc.invalidateQueries({ queryKey: queryKeys.financial.services.all() });
    },
  });
}
