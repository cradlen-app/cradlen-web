"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { inviteStaff } from "../lib/staff.api";
import { ApiError } from "@/lib/api";
import { toast } from "sonner";
import type { InviteStaffRequest } from "../types/staff.api.types";

export function useInviteStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      organizationId,
      data,
    }: {
      organizationId: string;
      data: InviteStaffRequest;
    }) => inviteStaff(organizationId, data),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["staff", variables.organizationId],
      });
    },
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? (error.messages[0] ?? "Failed to send invitation")
          : "Failed to send invitation";
      toast.error(message);
    },
  });
}
