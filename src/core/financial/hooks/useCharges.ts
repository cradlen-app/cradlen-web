"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { financialQueryKeys } from "@/core/financial/queryKeys";
import { getApiErrorMessage } from "@/common/errors/error";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";

import {
  cancelCharge,
  captureCharge,
  fetchCharges,
  fetchVisitCharges,
  updateCharge,
  voidCharge,
  writeOffCharge,
} from "../lib/charging.api";
import type {
  CaptureChargePayload,
  ChargeStatus,
  UpdateChargePayload,
} from "../types/financial.types";

export function useVisitCharges(visitId: string | undefined) {
  const orgId = useAuthContextStore((s) => s.organizationId);

  const query = useQuery({
    queryKey: financialQueryKeys.charges.byVisit(visitId ?? ""),
    queryFn: async () => {
      const res = await fetchVisitCharges(orgId!, visitId!);
      return res.data;
    },
    enabled: !!orgId && !!visitId,
  });

  return {
    charges: query.data?.charges ?? [],
    summary: query.data?.summary,
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useCharges(opts?: {
  status?: ChargeStatus;
  patientId?: string;
  visitId?: string;
}) {
  const orgId = useAuthContextStore((s) => s.organizationId);

  const query = useQuery({
    queryKey: financialQueryKeys.charges.list(orgId ?? "", {
      status: opts?.status,
      visitId: opts?.visitId,
    }),
    queryFn: async () => {
      const res = await fetchCharges(orgId!, {
        status: opts?.status,
        patient_id: opts?.patientId,
        visit_id: opts?.visitId,
        limit: 100,
      });
      return res.data;
    },
    enabled: !!orgId,
  });

  return {
    charges: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}

function useInvalidateCharges() {
  const qc = useQueryClient();
  return () =>
    void qc.invalidateQueries({ queryKey: financialQueryKeys.charges.all() });
}

export function useCaptureCharge() {
  const qc = useQueryClient();
  const orgId = useAuthContextStore((s) => s.organizationId);
  const invalidate = useInvalidateCharges();

  return useMutation({
    mutationFn: (payload: CaptureChargePayload) => captureCharge(orgId!, payload),
    onSuccess: () => {
      // The backend auto-bills the charge onto its case invoice inline, so refresh
      // both the charges list and the invoice side (episode invoice, open drawer,
      // billing queue) — the new line is on the invoice the moment the add returns.
      invalidate();
      void qc.invalidateQueries({
        queryKey: financialQueryKeys.invoices.all(),
      });
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to add charge"));
    },
  });
}

export function useUpdateCharge() {
  const orgId = useAuthContextStore((s) => s.organizationId);
  const invalidate = useInvalidateCharges();

  return useMutation({
    mutationFn: (vars: { id: string; payload: UpdateChargePayload }) =>
      updateCharge(orgId!, vars.id, vars.payload),
    onSuccess: invalidate,
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to update charge"));
    },
  });
}

export function useCancelCharge() {
  const orgId = useAuthContextStore((s) => s.organizationId);
  const invalidate = useInvalidateCharges();

  return useMutation({
    mutationFn: (id: string) => cancelCharge(orgId!, id),
    onSuccess: invalidate,
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to cancel charge"));
    },
  });
}

export function useVoidCharge() {
  const orgId = useAuthContextStore((s) => s.organizationId);
  const invalidate = useInvalidateCharges();

  return useMutation({
    mutationFn: (id: string) => voidCharge(orgId!, id),
    onSuccess: invalidate,
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to void charge"));
    },
  });
}

export function useWriteOffCharge() {
  const orgId = useAuthContextStore((s) => s.organizationId);
  const invalidate = useInvalidateCharges();

  return useMutation({
    mutationFn: (id: string) => writeOffCharge(orgId!, id),
    onSuccess: invalidate,
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to write off charge"));
    },
  });
}
