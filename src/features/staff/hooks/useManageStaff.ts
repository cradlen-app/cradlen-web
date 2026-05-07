"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deactivateStaff, updateStaff } from "../lib/staff.api";
import { queryKeys } from "@/lib/queryKeys";
import { getApiErrorMessage } from "@/lib/error";
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
        queryClient.invalidateQueries({
          queryKey: queryKeys.staff.byOrg(variables.organizationId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.staff.detail(
            variables.organizationId,
            variables.branchId,
            variables.staffId,
          ),
        }),
      ]);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to update staff member"));
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
        queryClient.invalidateQueries({
          queryKey: queryKeys.staff.byOrg(variables.organizationId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.staff.detail(
            variables.organizationId,
            variables.branchId,
            variables.staffId,
          ),
        }),
      ]);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to deactivate staff member"));
    },
  });
}
