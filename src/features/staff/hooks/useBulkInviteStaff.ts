"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { bulkInviteStaff } from "../lib/staff.api";
import type { BulkInviteStaffRequest } from "../types/staff.api.types";

export function useBulkInviteStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      organizationId,
      data,
    }: {
      organizationId: string;
      data: BulkInviteStaffRequest;
    }) => bulkInviteStaff(organizationId, data),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.staff.byOrg(variables.organizationId),
      });
    },
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? (error.messages[0] ?? "Failed to send bulk invitations")
          : "Failed to send bulk invitations";
      toast.error(message);
    },
  });
}
