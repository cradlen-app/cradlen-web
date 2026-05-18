"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/common/errors/error";
import { medicationQueryKeys } from "../lib/medications.queryKeys";
import {
  createMedication,
  updateMedication,
  deleteMedication,
} from "../lib/medications.api";
import type { CreateMedicationRequest, UpdateMedicationRequest } from "../types/medications.types";

export function useCreateMedication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMedicationRequest) => createMedication(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: medicationQueryKeys.all() });
      toast.success("Medication added successfully");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to add medication"));
    },
  });
}

export function useUpdateMedication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMedicationRequest }) =>
      updateMedication(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: medicationQueryKeys.all() });
      toast.success("Medication updated successfully");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to update medication"));
    },
  });
}

export function useDeleteMedication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMedication(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: medicationQueryKeys.all() });
      toast.success("Medication deleted");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to delete medication"));
    },
  });
}
