"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CURRENT_USER_QUERY_KEY } from "@/features/auth/hooks/useCurrentUser";
import {
  removeOrganizationLogo,
  uploadOrganizationLogo,
} from "../lib/settings.api";

function useInvalidateOrganizationLogo() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
  };
}

export function useUploadOrganizationLogo(organizationId: string | undefined) {
  const invalidate = useInvalidateOrganizationLogo();
  return useMutation({
    mutationFn: (file: File) => uploadOrganizationLogo(organizationId!, file),
    onSuccess: invalidate,
  });
}

export function useRemoveOrganizationLogo(organizationId: string | undefined) {
  const invalidate = useInvalidateOrganizationLogo();
  return useMutation({
    mutationFn: () => removeOrganizationLogo(organizationId!),
    onSuccess: invalidate,
  });
}
