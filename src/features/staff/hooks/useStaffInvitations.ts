"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteStaffInvitation,
  fetchStaffInvitation,
  fetchStaffInvitations,
  resendStaffInvitation,
  type FetchStaffInvitationsOptions,
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
  organizationId: string | undefined,
  branchId: string | undefined,
  { page = 1, limit = 100, status = "all" }: UseStaffInvitationsOptions = {},
) {
  return useQuery<{ data: ApiStaffInvitation[]; meta?: StaffInvitationsMeta }>({
    queryKey: [STAFF_INVITATIONS_QUERY_KEY, organizationId, branchId, page, limit, status],
    queryFn: async () =>
      unwrapInvitations(
        await fetchStaffInvitations({
          branchId: branchId!,
          limit,
          organizationId: organizationId!,
          page,
          status,
        } satisfies FetchStaffInvitationsOptions),
      ),
    enabled: !!organizationId && !!branchId,
    staleTime: 60 * 1000,
  });
}

export function useStaffInvitation(invitationId: string | null) {
  return useQuery({
    queryKey: [STAFF_INVITATIONS_QUERY_KEY, "detail", invitationId],
    queryFn: async () => unwrapInvitation(await fetchStaffInvitation(invitationId!)),
    enabled: !!invitationId,
    staleTime: 60 * 1000,
  });
}

export function useResendStaffInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: string) => resendStaffInvitation(invitationId),
    onSuccess: async (_data, invitationId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [STAFF_INVITATIONS_QUERY_KEY] }),
        queryClient.invalidateQueries({
          queryKey: [STAFF_INVITATIONS_QUERY_KEY, "detail", invitationId],
        }),
      ]);
    },
  });
}

export function useDeleteStaffInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: string) => deleteStaffInvitation(invitationId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [STAFF_INVITATIONS_QUERY_KEY] }),
        queryClient.invalidateQueries({ queryKey: ["staff"] }),
      ]);
    },
  });
}
