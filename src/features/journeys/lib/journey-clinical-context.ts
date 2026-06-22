"use client";

import { createContext, useContext } from "react";

/**
 * Carries the visit id down to custom journey-surface inputs (e.g. the pregnancy
 * status select, which needs it to call the close endpoint) — a builder field
 * input otherwise only knows its field/value. Provided by `JourneyClinicalTab`.
 */
export interface JourneyClinicalContextValue {
  visitId: string;
}

export const JourneyClinicalContext =
  createContext<JourneyClinicalContextValue | null>(null);

export function useJourneyClinicalContext(): JourneyClinicalContextValue | null {
  return useContext(JourneyClinicalContext);
}
