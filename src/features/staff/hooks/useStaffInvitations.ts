"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteStaffInvitation,
  fetchStaffInvitation,
  fetchStaffInvitations,
  resendStaffInvitation,
} from "../lib/staff.api";
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

export const STAFF_INVITATIONS_QUERY_KEY = "staff-invitations";

export function useStaffInvitations(
  accountId: string | undefined,
  _branchId: string | undefined,
  { page = 1, limit = 100, status = "all" }: UseStaffInvitationsOptions = {},
) {
  return useQuery<{ data: ApiStaffInvitation[]; meta?: StaffInvitationsMeta }>({
    queryKey: [STAFF_INVITATIONS_QUERY_KEY, accountId, page, limit, status],
    queryFn: async () =>
      unwrapInvitations(
        await fetchStaffInvitations({
          accountId: accountId!,
          limit,
          page,
          status,
        }),
      ),
    enabled: !!accountId,
    staleTime: 60 * 1000,
  });
}

export function useStaffInvitation(
  accountId: string | undefined,
  invitationId: string | null,
) {
  return useQuery({
    queryKey: [STAFF_INVITATIONS_QUERY_KEY, "detail", accountId, invitationId],
    queryFn: async () =>
      unwrapInvitation(await fetchStaffInvitation(accountId!, invitationId!)),
    enabled: !!accountId && !!invitationId,
    staleTime: 60 * 1000,
  });
}

type ResendVariables = {
  accountId: string;
  invitationId: string;
};

export function useResendStaffInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ accountId, invitationId }: ResendVariables) =>
      resendStaffInvitation(accountId, invitationId),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [STAFF_INVITATIONS_QUERY_KEY] }),
        queryClient.invalidateQueries({
          queryKey: [
            STAFF_INVITATIONS_QUERY_KEY,
            "detail",
            variables.accountId,
            variables.invitationId,
          ],
        }),
      ]);
    },
  });
}

type DeleteVariables = {
  accountId: string;
  invitationId: string;
};

export function useDeleteStaffInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ accountId, invitationId }: DeleteVariables) =>
      deleteStaffInvitation(accountId, invitationId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [STAFF_INVITATIONS_QUERY_KEY] }),
        queryClient.invalidateQueries({ queryKey: ["staff"] }),
      ]);
    },
  });
}
