"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createStaffDirect } from "../lib/staff.api";
import type { CreateStaffDirectRequest } from "../types/staff.api.types";

export function useCreateStaffDirect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      accountId,
      data,
    }: {
      accountId: string;
      data: CreateStaffDirectRequest;
    }) => createStaffDirect(accountId, data),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["staff", variables.accountId],
      });
    },
  });
}
