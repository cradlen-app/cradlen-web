"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSectionNote,
  deleteSectionNote,
  listSectionNotes,
  updateSectionNote,
  type NoteVisibility,
} from "./notes.api";

export const sectionNotesKey = (patientId: string, sectionCode: string) =>
  ["section-notes", patientId, sectionCode] as const;

export function useSectionNotes(
  patientId: string | null,
  sectionCode: string,
  enabled = true,
) {
  return useQuery({
    queryKey: patientId
      ? sectionNotesKey(patientId, sectionCode)
      : (["section-notes", "disabled"] as const),
    queryFn: async () => (await listSectionNotes(patientId!, sectionCode)).data,
    enabled: !!patientId && enabled,
    staleTime: 30_000,
  });
}

export function useCreateSectionNote(patientId: string, sectionCode: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { content: string; visibility?: NoteVisibility }) => {
      const res = await createSectionNote(patientId, {
        section_code: sectionCode,
        content: args.content,
        visibility: args.visibility,
      });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: sectionNotesKey(patientId, sectionCode),
      });
    },
  });
}

export function useUpdateSectionNote(patientId: string, sectionCode: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      noteId: string;
      content?: string;
      visibility?: NoteVisibility;
    }) => {
      const res = await updateSectionNote(args.noteId, {
        content: args.content,
        visibility: args.visibility,
      });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: sectionNotesKey(patientId, sectionCode),
      });
    },
  });
}

export function useDeleteSectionNote(patientId: string, sectionCode: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { noteId: string }) => {
      await deleteSectionNote(args.noteId);
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: sectionNotesKey(patientId, sectionCode),
      });
    },
  });
}