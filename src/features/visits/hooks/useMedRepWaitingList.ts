"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import {
  fetchMedRepBranchWaitingList,
  fetchMedRepMyWaitingList,
} from "../lib/medical-rep.api";
import { mapApiMedRepVisitToVisit } from "../lib/visits.utils";
import type { WaitingListPage } from "../types/visits.types";

type Params = {
  branchId: string | null | undefined;
  assignedToMe?: boolean;
  page: number;
  limit?: number;
};

export function useMedRepWaitingList({
  branchId,
  assignedToMe,
  page,
  limit = 10,
}: Params) {
  const enabled = assignedToMe ? true : !!branchId;
  const queryKey = assignedToMe
    ? queryKeys.medicalRepVisits.myWaitingList({ page, limit })
    : queryKeys.medicalRepVisits.branchWaitingList(branchId ?? "", {
        page,
        limit,
      });

  return useQuery({
    queryKey,
    queryFn: async (): Promise<WaitingListPage> => {
      const res = assignedToMe
        ? await fetchMedRepMyWaitingList({ page, limit })
        : await fetchMedRepBranchWaitingList({
            branchId: branchId!,
            page,
            limit,
          });
      const total = res.meta.total;
      const totalPages =
        res.meta.totalPages ??
        res.meta.total_pages ??
        Math.max(1, Math.ceil(total / Math.max(1, limit)));
      return {
        rows: res.data.map(mapApiMedRepVisitToVisit),
        page: res.meta.page,
        total,
        totalPages,
      };
    },
    enabled,
  });
}