"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { financialQueryKeys } from "@/core/financial/queryKeys";
import { getApiErrorMessage } from "@/common/errors/error";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";

import {
  createCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
} from "../lib/categories.api";
import type {
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from "../types/financial.types";

export function useCategories() {
  const orgId = useAuthContextStore((s) => s.organizationId);

  const query = useQuery({
    queryKey: financialQueryKeys.categories.list(orgId ?? ""),
    queryFn: async () => {
      const res = await fetchCategories(orgId!, { limit: 100 });
      return res.data;
    },
    enabled: !!orgId,
  });

  return {
    categories: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useCreateCategory() {
  const qc = useQueryClient();
  const orgId = useAuthContextStore((s) => s.organizationId);

  return useMutation({
    mutationFn: (payload: CreateCategoryPayload) =>
      createCategory(orgId!, payload),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: financialQueryKeys.categories.all(),
      });
      toast.success("Category created");
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to create category"));
    },
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  const orgId = useAuthContextStore((s) => s.organizationId);

  return useMutation({
    mutationFn: (vars: { id: string; payload: UpdateCategoryPayload }) =>
      updateCategory(orgId!, vars.id, vars.payload),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: financialQueryKeys.categories.all(),
      });
      toast.success("Category updated");
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to update category"));
    },
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  const orgId = useAuthContextStore((s) => s.organizationId);

  return useMutation({
    mutationFn: (id: string) => deleteCategory(orgId!, id),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: financialQueryKeys.categories.all(),
      });
      toast.success("Category deleted");
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Failed to delete category"));
    },
  });
}
