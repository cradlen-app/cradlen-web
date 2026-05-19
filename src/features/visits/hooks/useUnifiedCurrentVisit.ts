"use client";

import { useMemo } from "react";
import { useMyCurrentVisit } from "./useCurrentVisit";
import { useMedRepMyCurrentVisit } from "./useMedRepCurrentVisit";
import type { Visit } from "../types/visits.types";

/**
 * Returns all of the doctor's current in-progress visits (patient and/or medical-rep).
 */
export function useUnifiedMyCurrentVisit(enabled = true) {
  const patient = useMyCurrentVisit(enabled);
  const medRep = useMedRepMyCurrentVisit(enabled);

  const data = useMemo<Visit[]>(() => {
    if (patient.isLoading || medRep.isLoading) return [];
    return [patient.data, medRep.data].filter((v): v is Visit => v != null);
  }, [patient.data, medRep.data, patient.isLoading, medRep.isLoading]);

  return {
    data,
    isLoading: patient.isLoading || medRep.isLoading,
    isError: patient.isError || medRep.isError,
  };
}