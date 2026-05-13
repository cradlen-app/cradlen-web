"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { updateVisit, type UpdateVisitRequest as ApiUpdateRequest } from "../lib/visits.api";
import type { VisitIntake } from "../types/visits.api.types";

export type UpdateVisitRequest = VisitIntake & {
  assigned_doctor_id?: string;
  branch_id?: string;
  appointment_type?: ApiUpdateRequest["appointment_type"];
  priority?: ApiUpdateRequest["priority"];
  scheduled_at?: string;
  notes?: string | null;
  full_name?: string;
  national_id?: string;
  date_of_birth?: string;
  phone_number?: string;
  address?: string;
  marital_status?: "SINGLE" | "MARRIED" | "DIVORCED" | "WIDOWED" | "SEPARATED" | "ENGAGED" | "UNKNOWN";
  husband_name?: string;
  spouse_full_name?: string;
  spouse_national_id?: string;
  spouse_phone_number?: string;
  spouse_guardian_id?: string;
};

export function useUpdateVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      visitId,
      body,
    }: {
      visitId: string;
      body: UpdateVisitRequest;
      branchId?: string | null;
    }) => updateVisit({ visitId, body: body as ApiUpdateRequest }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.visits.all() });
      qc.invalidateQueries({ queryKey: queryKeys.visits.byId(vars.visitId) });
      qc.invalidateQueries({ queryKey: queryKeys.calendar.all() });
    },
  });
}