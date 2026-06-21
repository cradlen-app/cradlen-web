"use client";

import { createContext, useContext } from "react";

/**
 * Carries the current visit id down to the generic care-path picker
 * (`CasePathInput`, a builder field that otherwise only knows its field/value)
 * so picking "Pregnancy" can drive the activation drawer → POST /pregnancy.
 *
 * Null when no visit is in scope (e.g. booking-time care-path rendering); the
 * picker then falls back to the inert "coming soon" affordance.
 */
export interface PregnancyActivationContextValue {
  visitId: string;
}

export const PregnancyActivationContext =
  createContext<PregnancyActivationContextValue | null>(null);

export function usePregnancyActivationContext(): PregnancyActivationContextValue | null {
  return useContext(PregnancyActivationContext);
}
