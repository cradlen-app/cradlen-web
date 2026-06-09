"use client";

import { useQuery } from "@tanstack/react-query";
import { financialQueryKeys } from "@/core/financial/queryKeys";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { fetchServices } from "../lib/services.api";
import type { ServiceFilters } from "../types/financial.types";

export function useServices(filters?: ServiceFilters) {
  const orgId = useAuthContextStore((s) => s.organizationId);

  const query = useQuery({
    queryKey: financialQueryKeys.services.list(orgId ?? "", filters),
    queryFn: async () => {
      const res = await fetchServices(orgId!, filters);
      return res.data;
    },
    enabled: !!orgId,
  });

  return {
    services: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
