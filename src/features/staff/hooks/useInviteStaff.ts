"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { inviteStaff } from "../lib/staff.api";
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
  });
}
