"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { fetchProviderOverrides } from "../lib/pricing.api";

export function useProviderOverrides(profileId: string | null | undefined) {
  const orgId = useAuthContextStore((s) => s.organizationId);

  const query = useQuery({
    queryKey: queryKeys.financial.pricing.providerOverrides(orgId ?? "", profileId ?? ""),
    queryFn: async () => {
      const res = await fetchProviderOverrides(orgId!, profileId!);
      return res.data;
    },
    enabled: !!orgId && !!profileId,
  });

  return {
    overrides: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
