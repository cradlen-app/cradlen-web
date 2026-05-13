"use client";

import { useMemo } from "react";
import { useMyCurrentVisit } from "./useCurrentVisit";
import { useMedRepMyCurrentVisit } from "./useMedRepCurrentVisit";
import type { Visit } from "../types/visits.types";

/**
 * Returns the doctor's current in-progress visit — either patient or medical-rep.
 * Prefers the patient visit when both exist (rare; med-rep visits usually
 * shorter and shouldn't overlap, but be safe).
 */
export function useUnifiedMyCurrentVisit(enabled = true) {
  const patient = useMyCurrentVisit(enabled);
  const medRep = useMedRepMyCurrentVisit(enabled);

  const data = useMemo<Visit | null | undefined>(() => {
    if (patient.isLoading || medRep.isLoading) return undefined;
    return patient.data ?? medRep.data ?? null;
  }, [patient.data, medRep.data, patient.isLoading, medRep.isLoading]);

  return {
    data,
    isLoading: patient.isLoading || medRep.isLoading,
    isError: patient.isError || medRep.isError,
  };
}