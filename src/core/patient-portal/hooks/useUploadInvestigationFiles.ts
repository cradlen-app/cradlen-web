"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { uploadInvestigationFiles } from "../data/patient-portal.api";
import { patientPortalQueryKeys } from "../queryKeys";
import type { UploadFile } from "../types/patient-portal.types";

type UploadInvestigationFilesInput = {
  investigationId: string;
  files: UploadFile[];
};

/**
 * Attaches uploaded result files to an investigation (session-local mock until
 * a backend endpoint exists). On success it invalidates every investigations
 * query — across patients and status/type filters — so the new file chip
 * appears immediately.
 */
export function useUploadInvestigationFiles() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UploadInvestigationFilesInput) =>
      uploadInvestigationFiles(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...patientPortalQueryKeys.all(), "investigations"],
      });
    },
  });
}
