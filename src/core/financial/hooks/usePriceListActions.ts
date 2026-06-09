"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { financialQueryKeys } from "@/core/financial/queryKeys";
import { getApiErrorMessage } from "@/common/errors/error";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";

import {
  activatePriceList,
  deactivatePriceList,
  setDefaultPriceList,
  setPriceListItems,
} from "../lib/pricing.api";
import type { BulkPriceListItemsPayload } from "../types/financial.types";

function usePriceListInvalidate() {
  const qc = useQueryClient();
  const orgId = useAuthContextStore((s) => s.organizationId);
  return () =>
    void qc.invalidateQueries({
      queryKey: financialQueryKeys.pricing.priceLists(orgId ?? ""),
    });
}

export function useSetDefaultPriceList() {
  const orgId = useAuthContextStore((s) => s.organizationId);
  const invalidate = usePriceListInvalidate();
  return useMutation({
    mutationFn: (id: string) => setDefaultPriceList(orgId!, id),
    onSuccess: () => {
      invalidate();
      toast.success("Default price list updated");
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to set default price list"));
    },
  });
}

export function useTogglePriceListActive() {
  const orgId = useAuthContextStore((s) => s.organizationId);
  const invalidate = usePriceListInvalidate();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      active ? activatePriceList(orgId!, id) : deactivatePriceList(orgId!, id),
    onSuccess: (_data, variables) => {
      invalidate();
      toast.success(
        variables.active ? "Price list activated" : "Price list deactivated",
      );
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to update price list"));
    },
  });
}

export function useBulkSetPriceListItems(priceListId: string) {
  const qc = useQueryClient();
  const orgId = useAuthContextStore((s) => s.organizationId);
  return useMutation({
    mutationFn: (payload: BulkPriceListItemsPayload) =>
      setPriceListItems(orgId!, priceListId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: financialQueryKeys.pricing.priceListItems(priceListId),
      });
      toast.success("Prices updated");
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to bulk-update prices"));
    },
  });
}
