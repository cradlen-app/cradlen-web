"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryKeys } from "@/lib/queryKeys";
import { getApiErrorMessage } from "@/common/errors/error";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { deleteService } from "../lib/services.api";

export function useDeleteService() {
  const qc = useQueryClient();
  const orgId = useAuthContextStore((s) => s.organizationId);

  return useMutation({
    mutationFn: (id: string) => deleteService(orgId!, id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.financial.services.all() });
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to delete service"));
    },
  });
}
