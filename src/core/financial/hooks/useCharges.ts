"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
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

/**
 * Shared factory for the charge write-path mutations. Every charge mutation
 * needs the same plumbing — resolve the active org id, invalidate the charges
 * cache on success, and surface an i18n'd toast on failure — so they're
 * declared once here and parameterized per operation.
 *
 * `errorKey` indexes `financial.charges.errors.*`; `invalidateInvoices` opts a
 * mutation into refreshing the invoice side as well (only capture needs it).
 */
function useChargeMutation<TVars>(config: {
  mutationFn: (orgId: string, vars: TVars) => Promise<unknown>;
  errorKey: "capture" | "update" | "cancel" | "void" | "writeOff";
  invalidateInvoices?: boolean;
}) {
  const qc = useQueryClient();
  const orgId = useAuthContextStore((s) => s.organizationId);
  const t = useTranslations("financial.charges.errors");

  return useMutation({
    mutationFn: (vars: TVars) => config.mutationFn(orgId!, vars),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: financialQueryKeys.charges.all(),
      });
      if (config.invalidateInvoices) {
        // Auto-billing lands the captured charge on its case invoice via the
        // server-side `charge.captured` listener (best-effort, post-commit), so
        // the invoice side must refresh too. We can't scope to the affected
        // invoice — its id isn't returned to the client — and the billing queue
        // is a cross-visit list, so a `forVisit()` invalidation would leave it
        // stale. Invalidate the invoice root; in practice only the current
        // visit's invoice query is mounted, so the refetch cost is minimal.
        void qc.invalidateQueries({
          queryKey: financialQueryKeys.invoices.all(),
        });
      }
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, t(config.errorKey)));
    },
  });
}

export function useCaptureCharge() {
  return useChargeMutation<CaptureChargePayload>({
    mutationFn: (orgId, payload) => captureCharge(orgId, payload),
    errorKey: "capture",
    invalidateInvoices: true,
  });
}

export function useUpdateCharge() {
  return useChargeMutation<{ id: string; payload: UpdateChargePayload }>({
    mutationFn: (orgId, vars) => updateCharge(orgId, vars.id, vars.payload),
    errorKey: "update",
  });
}

export function useCancelCharge() {
  return useChargeMutation<string>({
    mutationFn: (orgId, id) => cancelCharge(orgId, id),
    errorKey: "cancel",
  });
}

export function useVoidCharge() {
  return useChargeMutation<string>({
    mutationFn: (orgId, id) => voidCharge(orgId, id),
    errorKey: "void",
  });
}

export function useWriteOffCharge() {
  return useChargeMutation<string>({
    mutationFn: (orgId, id) => writeOffCharge(orgId, id),
    errorKey: "writeOff",
  });
}
