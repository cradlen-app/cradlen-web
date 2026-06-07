"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/common/errors/error";
import { staffQueryKeys } from "../queryKeys";
import { removeStaffFromBranch, updateStaff } from "../lib/staff.api";
import type { UpdateStaffRequest } from "../types/staff.api.types";

type UpdateStaffVariables = {
  organizationId: string;
  branchId: string;
  staffId: string;
  data: UpdateStaffRequest;
};

type RemoveStaffVariables = {
  organizationId: string;
  branchId: string;
  staffId: string;
};

export function useUpdateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, branchId, staffId, data }: UpdateStaffVariables) =>
      updateStaff(organizationId, branchId, staffId, data),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: staffQueryKeys.byOrg(variables.organizationId),
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to update staff member"));
    },
  });
}

/**
 * Remove a staff member from a single branch (OWNER + scoped BRANCH_MANAGER).
 * If it's their last branch the backend soft-deletes the whole profile.
 */
export function useRemoveStaffFromBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, branchId, staffId }: RemoveStaffVariables) =>
      removeStaffFromBranch(organizationId, branchId, staffId),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: staffQueryKeys.byOrg(variables.organizationId),
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to remove staff from branch"));
    },
  });
}
