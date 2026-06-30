"use client";

import { useMutation } from "@tanstack/react-query";
import { apiAuthFetch } from "@/infrastructure/http/api";

export type FeedbackCategory = "FEATURE" | "BUG" | "OTHER";

export interface SubmitFeedbackInput {
  category: FeedbackCategory;
  message: string;
  creditConsent: boolean;
  /** Path the user was on when submitting (full window path + search). */
  pageUrl: string;
  /** Baked-in app version (BUILD_INFO.version). */
  appVersion: string;
  /** Active UI locale. */
  locale: string;
}

interface FeedbackResponse {
  data: {
    id: string;
    category: FeedbackCategory;
    status: string;
    created_at: string;
  };
}

/**
 * Submits an in-app "Help us improve Cradlen" suggestion. Goes through the
 * same-origin `/api/backend` proxy (via `apiAuthFetch`), so the backend gets the
 * authenticated user + org/branch context automatically.
 */
export function useSubmitFeedback() {
  return useMutation({
    mutationFn: (input: SubmitFeedbackInput) =>
      apiAuthFetch<FeedbackResponse>("/feedback", {
        method: "POST",
        body: JSON.stringify({
          category: input.category,
          message: input.message,
          credit_consent: input.creditConsent,
          page_url: input.pageUrl,
          app_version: input.appVersion,
          locale: input.locale,
        }),
      }),
  });
}
