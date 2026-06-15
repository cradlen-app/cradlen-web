"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import {
  cancelPayment,
  createPayment,
  getCurrentSubscription,
  getPayment,
  listAddOns,
  listPayments,
  listPlans,
  removeProof,
  uploadProof,
  type ListPaymentsOptions,
} from "../lib/subscriptions.api";
import type { CreatePaymentRequest } from "../lib/subscriptions.types";

export function usePlans() {
  return useQuery({
    queryKey: queryKeys.subscription.plans(),
    queryFn: listPlans,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCurrentSubscription(organizationId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.subscription.current(organizationId ?? ""),
    queryFn: () => getCurrentSubscription(organizationId!),
    enabled: !!organizationId,
  });
}

export function useAddOns(organizationId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.subscription.addOns(organizationId ?? ""),
    queryFn: () => listAddOns(organizationId!),
    enabled: !!organizationId,
    staleTime: 10 * 60 * 1000,
  });
}

export function usePayments(
  organizationId: string | undefined,
  opts: ListPaymentsOptions = {},
) {
  return useQuery({
    queryKey: queryKeys.subscription.payments(organizationId ?? "", {
      status: opts.status,
    }),
    queryFn: () => listPayments(organizationId!, opts),
    enabled: !!organizationId,
  });
}

export function usePayment(
  organizationId: string | undefined,
  paymentId: string | undefined,
) {
  return useQuery({
    queryKey: queryKeys.subscription.payment(
      organizationId ?? "",
      paymentId ?? "",
    ),
    queryFn: () => getPayment(organizationId!, paymentId!),
    enabled: !!organizationId && !!paymentId,
  });
}

function useInvalidateSubscription(organizationId: string | undefined) {
  const queryClient = useQueryClient();
  return () => {
    if (!organizationId) return;
    queryClient.invalidateQueries({
      queryKey: ["subscription", organizationId],
    });
  };
}

export function useCreatePayment(organizationId: string | undefined) {
  const invalidate = useInvalidateSubscription(organizationId);
  return useMutation({
    mutationFn: (data: CreatePaymentRequest) =>
      createPayment(organizationId!, data),
    onSuccess: invalidate,
  });
}

export function useUploadProof(
  organizationId: string | undefined,
  paymentId: string | undefined,
) {
  const invalidate = useInvalidateSubscription(organizationId);
  return useMutation({
    mutationFn: (file: File) =>
      uploadProof(organizationId!, paymentId!, file),
    onSuccess: invalidate,
  });
}

export function useRemoveProof(
  organizationId: string | undefined,
  paymentId: string | undefined,
) {
  const invalidate = useInvalidateSubscription(organizationId);
  return useMutation({
    mutationFn: (proofId: string) =>
      removeProof(organizationId!, paymentId!, proofId),
    onSuccess: invalidate,
  });
}

export function useCancelPayment(organizationId: string | undefined) {
  const invalidate = useInvalidateSubscription(organizationId);
  return useMutation({
    mutationFn: (paymentId: string) => cancelPayment(organizationId!, paymentId),
    onSuccess: invalidate,
  });
}
