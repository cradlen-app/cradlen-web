import { apiAuthFetch } from "@/infrastructure/http/api";
import type { PregnancyOutcome } from "./pregnancy.api";

/**
 * Surgical lifecycle client. Activation is the "Create surgical profile" drawer:
 * it opens a NEW surgical journey (care_path = OBGYN_SURGICAL) and an ACTIVE
 * profile, which makes the journey descriptor declare the clinical surface → the
 * Surgical tab appears. When the patient has an active pregnancy, the backend
 * returns 409 PREGNANCY_ACTIVE_REQUIRES_CLOSE unless `pregnancy_outcome` is
 * supplied (the cesarean handoff — closes the pregnancy + opens surgery in one tx).
 */
export interface SurgicalProfile {
  journey_id: string;
  status: string;
  created_at: string;
}

export interface ActivateSurgicalBody {
  procedure_id?: string;
  procedure_code?: string;
  procedure_name?: string;
  indication?: string;
  planned_date?: string;
  surgery_date?: string;
  urgency?: string;
  anesthesia_type?: string;
  /** Cesarean handoff: closes the active pregnancy with this outcome first. */
  pregnancy_outcome?: PregnancyOutcome;
}

export type SurgicalOutcomeType =
  | "COMPLETED"
  | "ABORTED"
  | "CONVERTED"
  | "TRANSFERRED"
  | "DECEASED"
  | "OTHER";

/** How the surgical journey ended. */
export interface SurgicalOutcome {
  outcome_type: SurgicalOutcomeType;
  date?: string;
  complications?: string[];
  notes?: string;
}

/** The 409 code the backend returns when an active pregnancy must be closed. */
export const PREGNANCY_ACTIVE_REQUIRES_CLOSE = "PREGNANCY_ACTIVE_REQUIRES_CLOSE";

export function activateSurgical(
  visitId: string,
  body: ActivateSurgicalBody = {},
): Promise<{ data: SurgicalProfile }> {
  return apiAuthFetch<{ data: SurgicalProfile }>(
    `/visits/${encodeURIComponent(visitId)}/surgical`,
    { method: "POST", body: JSON.stringify(body) },
  );
}

export function closeSurgical(
  visitId: string,
  outcome: SurgicalOutcome,
): Promise<{ data: SurgicalProfile }> {
  return apiAuthFetch<{ data: SurgicalProfile }>(
    `/visits/${encodeURIComponent(visitId)}/surgical/close`,
    { method: "POST", body: JSON.stringify({ outcome }) },
  );
}
