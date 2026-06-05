"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { queryKeys } from "@/lib/queryKeys";
import {
  fetchInvestigationReview,
  submitInvestigationReview,
} from "../data/investigation-review.api";
import type { SubmitInvestigationReviewInput } from "../types/investigation-review.types";

/** Fetches the investigation under review. Gated until an id is provided. */
export function useInvestigationReview(id: string | null) {
  return useQuery({
    queryKey: queryKeys.investigations.review(id ?? "none"),
    queryFn: () => fetchInvestigationReview(id as string),
    enabled: Boolean(id),
  });
}

/**
 * Submits the doctor's review notes (marks the investigation reviewed in the
 * mock). Invalidates the review query and the notifications list on success.
 */
export function useSubmitInvestigationReview() {
  const queryClient = useQueryClient();
  const t = useTranslations("investigationReview");

  return useMutation({
    mutationFn: (input: SubmitInvestigationReviewInput) =>
      submitInvestigationReview(input),
    onSuccess: (review) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.investigations.review(review.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all(),
      });
      toast.success(t("saved"));
    },
  });
}
