"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { updatePatient, type UpdatePatientRequest } from "../lib/patients.api";

type Variables = {
  id: string;
  data: UpdatePatientRequest;
};

export function useUpdatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: Variables) => updatePatient(id, data),
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.patients.byId(variables.id),
        }),
        // The directory list rows carry demographics — refresh them too.
        queryClient.invalidateQueries({ queryKey: ["patients"] }),
      ]);
    },
  });
}
