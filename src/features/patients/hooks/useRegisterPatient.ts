"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import {
  registerPatient,
  type RegisterPatientRequest,
} from "../lib/patients.api";

/**
 * Registers a patient without booking a visit.
 *
 * Invalidates the whole `patients` family rather than a single list key: the
 * new row's position depends on the active branch, search term and journey
 * filter, none of which this hook knows about. The analytics cards read from
 * the same family and also gain a patient.
 */
export function useRegisterPatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegisterPatientRequest) => registerPatient(data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.patients.all() }),
  });
}
