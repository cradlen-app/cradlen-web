"use client";

import { useQuery } from "@tanstack/react-query";
import { financialQueryKeys } from "@/core/financial/queryKeys";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { fetchInvoices } from "../lib/invoices.api";

/**
 * The active (non-VOID) invoice for a clinical case (episode), if one exists.
 * Resolves the single open invoice per case from any of the episode's visits, so
 * reopening the drawer on a later visit shows the existing invoice rather than
 * building a duplicate.
 */
export function useEpisodeInvoice(episodeId: string | undefined) {
  const orgId = useAuthContextStore((s) => s.organizationId);

  const query = useQuery({
    queryKey: financialQueryKeys.invoices.list(orgId ?? "", {
      episode_id: episodeId,
    }),
    queryFn: async () => {
      const res = await fetchInvoices(orgId!, { episode_id: episodeId });
      return res.data;
    },
    enabled: !!orgId && !!episodeId,
  });

  const invoice = (query.data ?? []).find((i) => i.status !== "VOID") ?? null;

  return { invoice, isLoading: query.isLoading };
}
