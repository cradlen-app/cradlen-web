import { apiAuthFetch } from "@/infrastructure/http/api";

export type SummarySignalSeverity = "high" | "medium" | "low" | "positive";

export interface CurrentEpisode {
  name: string;
  order: number;
  status: string;
}

export interface JourneyEncounter {
  chief_complaint: string | null;
  provisional_diagnosis: string | null;
}

export interface JourneyIdentifier {
  ga: string | null;
  ga_source: "US" | "LMP" | null;
  edd: string | null;
  lmp: string | null;
  risk_level: string | null;
  pregnancy_type: string | null;
  number_of_fetuses: number | null;
  blood_group_rh: string | null;
}

export interface JourneySummaryFlag {
  label: string;
  severity: SummarySignalSeverity;
}

/**
 * Server-curated summary of the patient's current journey (active, else most-
 * recent completed). Mirrors the backend `ActiveJourneySummaryDto`.
 */
export interface ActiveJourneySummary {
  journey_exists: boolean;
  journey_id: string | null;
  care_path_code: string | null;
  care_path_label: string | null;
  status: string | null;
  is_active: boolean;
  started_at: string | null;
  ended_at: string | null;
  current_episode: CurrentEpisode | null;
  encounter: JourneyEncounter | null;
  identifier: JourneyIdentifier | null;
  outcome: Record<string, unknown> | null;
  flags: JourneySummaryFlag[];
  narrative: string;
}

export function fetchActiveJourneySummary(
  patientId: string,
): Promise<{ data: ActiveJourneySummary }> {
  return apiAuthFetch<{ data: ActiveJourneySummary }>(
    `/patients/${patientId}/active-journey-summary`,
  );
}
