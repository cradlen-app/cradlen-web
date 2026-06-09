"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { financialQueryKeys } from "@/core/financial/queryKeys";
import { getApiErrorMessage } from "@/common/errors/error";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";

import {
  closeCashSession,
  fetchCashSessions,
  fetchCurrentCashSession,
  openCashSession,
  reconcileCashSession,
} from "../lib/cash.api";
import type {
  CashSessionStatus,
  CloseCashSessionPayload,
  OpenCashSessionPayload,
} from "../types/financial.types";

export function useCurrentCashSession() {
  const orgId = useAuthContextStore((s) => s.organizationId);
  const branchId = useAuthContextStore((s) => s.branchId);

  const query = useQuery({
    queryKey: financialQueryKeys.cashSessions.current(
      orgId ?? "",
      branchId ?? "",
    ),
    queryFn: async () => {
      const res = await fetchCurrentCashSession(orgId!, branchId!);
      return res.data;
    },
    enabled: !!orgId && !!branchId,
  });

  return {
    session: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useCashSessions(status?: CashSessionStatus) {
  const orgId = useAuthContextStore((s) => s.organizationId);
  const branchId = useAuthContextStore((s) => s.branchId);

  const query = useQuery({
    queryKey: financialQueryKeys.cashSessions.list(orgId ?? "", branchId ?? ""),
    queryFn: async () => {
      const res = await fetchCashSessions(orgId!, {
        branch_id: branchId ?? undefined,
        status,
        limit: 50,
      });
      return res.data;
    },
    enabled: !!orgId,
  });

  return {
    sessions: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}

function useInvalidateCashSessions() {
  const qc = useQueryClient();
  return () =>
    void qc.invalidateQueries({
      queryKey: financialQueryKeys.cashSessions.all(),
    });
}

export function useOpenCashSession() {
  const orgId = useAuthContextStore((s) => s.organizationId);
  const invalidate = useInvalidateCashSessions();

  return useMutation({
    mutationFn: (payload: OpenCashSessionPayload) =>
      openCashSession(orgId!, payload),
    onSuccess: () => {
      invalidate();
      toast.success("Cash session opened");
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to open cash session"));
    },
  });
}

export function useCloseCashSession() {
  const orgId = useAuthContextStore((s) => s.organizationId);
  const invalidate = useInvalidateCashSessions();

  return useMutation({
    mutationFn: (vars: { id: string; payload: CloseCashSessionPayload }) =>
      closeCashSession(orgId!, vars.id, vars.payload),
    onSuccess: () => {
      invalidate();
      toast.success("Cash session closed");
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to close cash session"));
    },
  });
}

export function useReconcileCashSession() {
  const orgId = useAuthContextStore((s) => s.organizationId);
  const invalidate = useInvalidateCashSessions();

  return useMutation({
    mutationFn: (id: string) => reconcileCashSession(orgId!, id),
    onSuccess: () => {
      invalidate();
      toast.success("Cash session reconciled");
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to reconcile cash session"));
    },
  });
}
