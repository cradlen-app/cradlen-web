"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/common/errors/error";
import { staffQueryKeys } from "../queryKeys";
import {
  deactivateStaff,
  reactivateStaff,
  removeStaffFromBranch,
  resetStaffPassword,
  updateStaff,
} from "../lib/staff.api";
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

type ResetStaffPasswordVariables = {
  organizationId: string;
  branchId: string;
  staffId: string;
  password: string;
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

/**
 * Deactivate a staff member: frees their seat (keeps the record) so the org can
 * fit a smaller plan. Cannot target yourself or the last active OWNER.
 */
export function useDeactivateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, branchId, staffId }: RemoveStaffVariables) =>
      deactivateStaff(organizationId, branchId, staffId),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: staffQueryKeys.byOrg(variables.organizationId),
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to deactivate staff member"));
    },
  });
}

/** Reactivate a deactivated staff member (re-occupies a seat; plan-limit gated). */
export function useReactivateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, branchId, staffId }: RemoveStaffVariables) =>
      reactivateStaff(organizationId, branchId, staffId),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: staffQueryKeys.byOrg(variables.organizationId),
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to reactivate staff member"));
    },
  });
}

/**
 * Admin-initiated password reset for a staff member (OWNER + scoped
 * BRANCH_MANAGER). Backend revokes the target's active sessions.
 */
export function useResetStaffPassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, branchId, staffId, password }: ResetStaffPasswordVariables) =>
      resetStaffPassword(organizationId, branchId, staffId, { password }),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: staffQueryKeys.byOrg(variables.organizationId),
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to reset staff password"));
    },
  });
}
