"use client";

import { useQuery } from "@tanstack/react-query";
import { financialQueryKeys } from "@/core/financial/queryKeys";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { resolvePrice } from "../lib/pricing.api";

export function useResolvePrice(
  serviceId: string | null | undefined,
  branchId: string | null | undefined,
  profileId?: string | null,
) {
  const orgId = useAuthContextStore((s) => s.organizationId);

  const query = useQuery({
    queryKey: financialQueryKeys.pricing.resolvedPrice(
      orgId ?? "",
      serviceId ?? "",
      branchId ?? "",
      profileId ?? undefined,
    ),
    queryFn: async () => {
      const res = await resolvePrice(orgId!, serviceId!, branchId!, profileId ?? undefined);
      return res.data;
    },
    enabled: !!serviceId && !!branchId && !!orgId,
    staleTime: 5 * 60 * 1000,
  });

  return {
    resolvedPrice: query.data,
    isLoading: query.isLoading,
  };
}
