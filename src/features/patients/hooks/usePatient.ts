"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { fetchPatientById } from "../lib/patients.api";

export function usePatient(id: string | null | undefined) {
  return useQuery({
    queryKey: id ? queryKeys.patients.byId(id) : ["patients", "byId", "disabled"],
    queryFn: () => fetchPatientById(id!),
    enabled: !!id,
  });
}