"use client";

import { create } from "zustand";

/**
 * Controls the global doctor-side investigation review drawer. The notification
 * click handler calls `open(investigationId)`; the drawer (mounted once in the
 * navbar) reacts to `openId`.
 */
type InvestigationReviewState = {
  openId: string | null;
  open: (id: string) => void;
  close: () => void;
};

export const useInvestigationReviewStore = create<InvestigationReviewState>(
  (set) => ({
    openId: null,
    open: (id) => set({ openId: id }),
    close: () => set({ openId: null }),
  }),
);
