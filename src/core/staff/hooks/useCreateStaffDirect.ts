"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createStaffDirect } from "../lib/staff.api";
import { ApiError } from "@/infrastructure/http/api";
import { staffQueryKeys } from "../queryKeys";
import { toast } from "sonner";
import type { CreateStaffDirectRequest } from "../types/staff.api.types";

export function useCreateStaffDirect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      organizationId,
      data,
    }: {
      organizationId: string;
      data: CreateStaffDirectRequest;
    }) => createStaffDirect(organizationId, data),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: staffQueryKeys.byOrg(variables.organizationId),
      });
    },
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? (error.messages[0] ?? "Failed to create staff member")
          : "Failed to create staff member";
      toast.error(message);
    },
  });
}
