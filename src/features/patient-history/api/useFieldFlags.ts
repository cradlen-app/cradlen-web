"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listFieldFlags,
  upsertFieldFlag,
  updateFieldFlagNote,
  removeFieldFlag,
  type UpsertFieldFlagArgs,
  type UpdateFieldFlagNoteArgs,
} from "./field-flags.api";

export const fieldFlagsKey = (patientId: string) =>
  ["patient-field-flags", patientId] as const;

export function useFieldFlags(patientId: string | null) {
  return useQuery({
    queryKey: patientId
      ? fieldFlagsKey(patientId)
      : (["patient-field-flags", "disabled"] as const),
    queryFn: async () => {
      const res = await listFieldFlags(patientId!);
      return res.data;
    },
    enabled: !!patientId,
    staleTime: 30_000,
  });
}

export function useUpsertFieldFlag(patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: Omit<UpsertFieldFlagArgs, "patientId">) => {
      const res = await upsertFieldFlag({ patientId, ...args });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: fieldFlagsKey(patientId) });
    },
  });
}

export function useUpdateFieldFlagNote(patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: UpdateFieldFlagNoteArgs) => {
      const res = await updateFieldFlagNote({ ...args });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: fieldFlagsKey(patientId) });
    },
  });
}

export function useRemoveFieldFlag(patientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (flagId: string) => {
      await removeFieldFlag(flagId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: fieldFlagsKey(patientId) });
    },
  });
}
