"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/error";
import { queryKeys } from "@/lib/queryKeys";
import { deactivateStaff, unassignStaffFromBranch, updateStaff } from "../lib/staff.api";
import type { UpdateStaffRequest } from "../types/staff.api.types";

type UpdateStaffVariables = {
  organizationId: string;
  staffId: string;
  data: UpdateStaffRequest;
};

type DeactivateStaffVariables = {
  organizationId: string;
  staffId: string;
};

type UnassignVariables = DeactivateStaffVariables & { branchId: string };

export function useUpdateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, staffId, data }: UpdateStaffVariables) =>
      updateStaff(organizationId, staffId, data),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.staff.byOrg(variables.organizationId),
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to update staff member"));
    },
  });
}

export function useDeactivateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, staffId }: DeactivateStaffVariables) =>
      deactivateStaff(organizationId, staffId),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.staff.byOrg(variables.organizationId),
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to deactivate staff member"));
    },
  });
}

/** Unassign a staff member from a single branch (allowed for OWNER + scoped BRANCH_MANAGER). */
export function useUnassignStaffFromBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, staffId, branchId }: UnassignVariables) =>
      unassignStaffFromBranch(organizationId, staffId, branchId),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.staff.byOrg(variables.organizationId),
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to unassign staff from branch"));
    },
  });
}
