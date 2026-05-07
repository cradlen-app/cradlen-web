"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deactivateStaff, updateStaff } from "../lib/staff.api";
import { ApiError } from "@/lib/api";
import { toast } from "sonner";
import type { UpdateStaffRequest } from "../types/staff.api.types";

type UpdateStaffVariables = {
  branchId: string;
  data: UpdateStaffRequest;
  organizationId: string;
  staffId: string;
};

type DeactivateStaffVariables = {
  branchId: string;
  organizationId: string;
  staffId: string;
};

export function useUpdateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      branchId,
      data,
      organizationId,
      staffId,
    }: UpdateStaffVariables) =>
      updateStaff(staffId, data, {
        branchId,
        organizationId,
      }),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["staff"] }),
        queryClient.invalidateQueries({
          queryKey: [
            "staff",
            "detail",
            variables.organizationId,
            variables.branchId,
            variables.staffId,
          ],
        }),
      ]);
    },
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? (error.messages[0] ?? "Failed to update staff member")
          : "Failed to update staff member";
      toast.error(message);
    },
  });
}

export function useDeactivateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      branchId,
      organizationId,
      staffId,
    }: DeactivateStaffVariables) =>
      deactivateStaff(staffId, { branchId, organizationId }),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["staff"] }),
        queryClient.invalidateQueries({
          queryKey: [
            "staff",
            "detail",
            variables.organizationId,
            variables.branchId,
            variables.staffId,
          ],
        }),
      ]);
    },
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? (error.messages[0] ?? "Failed to deactivate staff member")
          : "Failed to deactivate staff member";
      toast.error(message);
    },
  });
}
