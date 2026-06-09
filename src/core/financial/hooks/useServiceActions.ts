"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { financialQueryKeys } from "@/core/financial/queryKeys";
import { getApiErrorMessage } from "@/common/errors/error";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";

import { activateService, deactivateService } from "../lib/services.api";

/** Toggle a service's active state (POST /activate or /deactivate). */
export function useToggleServiceActive() {
  const qc = useQueryClient();
  const orgId = useAuthContextStore((s) => s.organizationId);

  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      active ? activateService(orgId!, id) : deactivateService(orgId!, id),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: financialQueryKeys.services.all() });
      toast.success(
        variables.active ? "Service activated" : "Service deactivated",
      );
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to update service"));
    },
  });
}
