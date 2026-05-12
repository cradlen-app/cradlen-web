"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteStaffInvitation,
  fetchStaffInvitation,
  fetchStaffInvitations,
  resendStaffInvitation,
} from "../lib/staff.api";
import { staffQueryKeys } from "../queryKeys";
import { getApiErrorMessage } from "@/common/errors/error";
import { toast } from "sonner";
import type {
  ApiStaffInvitation,
  StaffInvitationResponse,
  StaffInvitationsMeta,
  StaffInvitationsResponse,
} from "../types/staff.api.types";

type UseStaffInvitationsOptions = {
  limit?: number;
  page?: number;
  status?: string;
};

function unwrapInvitations(response: StaffInvitationsResponse) {
  if (Array.isArray(response)) {
    return {
      data: response,
      meta: undefined,
    };
  }

  return {
    data: response.data,
    meta: response.meta,
  };
}

function unwrapInvitation(response: StaffInvitationResponse): ApiStaffInvitation {
  return "data" in response ? response.data : response;
}

/** @deprecated Use `staffQueryKeys.invitations.all()` directly instead. */
export const STAFF_INVITATIONS_QUERY_KEY = staffQueryKeys.invitations.all();

export function useStaffInvitations(
  organizationId: string | undefined,
  _branchId: string | undefined,
  { page = 1, limit = 100, status = "all" }: UseStaffInvitationsOptions = {},
  // Note: `status` only namespaces the cache. Backend has no `status` query param —
  // filter on the client (see spec §4.3).
) {
  return useQuery<{ data: ApiStaffInvitation[]; meta?: StaffInvitationsMeta }>({
    queryKey: staffQueryKeys.invitations.list(organizationId ?? "", { page, limit, status }),
    queryFn: async () =>
      unwrapInvitations(
        await fetchStaffInvitations({
          organizationId: organizationId!,
          limit,
          page,
        }),
      ),
    enabled: !!organizationId,
    staleTime: 60 * 1000,
  });
}

export function useStaffInvitation(
  organizationId: string | undefined,
  invitationId: string | null,
) {
  return useQuery({
    queryKey: staffQueryKeys.invitations.detail(organizationId ?? "", invitationId ?? ""),
    queryFn: async () =>
      unwrapInvitation(await fetchStaffInvitation(organizationId!, invitationId!)),
    enabled: !!organizationId && !!invitationId,
    staleTime: 60 * 1000,
  });
}

type ResendVariables = {
  organizationId: string;
  invitationId: string;
};

export function useResendStaffInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, invitationId }: ResendVariables) =>
      resendStaffInvitation(organizationId, invitationId),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: staffQueryKeys.invitations.all() }),
        queryClient.invalidateQueries({
          queryKey: staffQueryKeys.invitations.detail(
            variables.organizationId,
            variables.invitationId,
          ),
        }),
      ]);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to resend invitation"));
    },
  });
}

type DeleteVariables = {
  organizationId: string;
  invitationId: string;
};

export function useDeleteStaffInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, invitationId }: DeleteVariables) =>
      deleteStaffInvitation(organizationId, invitationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: staffQueryKeys.invitations.all(),
      });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to delete invitation"));
    },
  });
}
