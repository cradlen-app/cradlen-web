"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CURRENT_USER_QUERY_KEY } from "@/features/auth/hooks/useCurrentUser";
import { staffQueryKeys } from "@/core/staff/api";
import {
  removeProfileImage,
  uploadProfileImage,
} from "../lib/settings.api";

function useInvalidateProfileImage(organizationId?: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
    if (organizationId) {
      queryClient.invalidateQueries({
        queryKey: staffQueryKeys.byOrg(organizationId),
      });
    }
  };
}

export function useUploadProfileImage(
  profileId: string | undefined,
  organizationId?: string,
) {
  const invalidate = useInvalidateProfileImage(organizationId);
  return useMutation({
    mutationFn: (file: File) => uploadProfileImage(profileId!, file),
    onSuccess: invalidate,
  });
}

export function useRemoveProfileImage(
  profileId: string | undefined,
  organizationId?: string,
) {
  const invalidate = useInvalidateProfileImage(organizationId);
  return useMutation({
    mutationFn: () => removeProfileImage(profileId!),
    onSuccess: invalidate,
  });
}
