import type {
  ApiJourneyStatus,
  ApiPaginationMeta,
} from "./visits.api.types";

export type ApiVisitHistoryMedication = {
  name: string;
  dose: string;
};

export type ApiVisitHistoryEntry = {
  id: string;
  appointment_type: "VISIT" | "FOLLOW_UP";
  completed_at: string;
  diagnosis: string | null;
  medications: ApiVisitHistoryMedication[];
  investigations: string[];
};

export type ApiVisitHistoryResponse = {
  data: ApiVisitHistoryEntry[];
  meta: ApiPaginationMeta;
};

// ── Journey timeline (Journey → Episode → Visit tree) ──────────────────────────

export type ApiJourneyTimelineEpisode = {
  id: string;
  name: string;
  order: number;
  status: string;
  started_at: string | null;
  ended_at: string | null;
  visits: ApiVisitHistoryEntry[];
};

export type ApiJourneyTimelineEntry = {
  id: string;
  /** Journey display name (from the journey template, e.g. "Pregnancy"). */
  name: string;
  type: string;
  status: ApiJourneyStatus;
  started_at: string;
  ended_at: string | null;
  episodes: ApiJourneyTimelineEpisode[];
};

export type ApiJourneyTimelineResponse = {
  data: ApiJourneyTimelineEntry[];
  meta: ApiPaginationMeta;
};

export type ApiVitalsTrendPoint = {
  visit_id: string;
  completed_at: string;
  systolic_bp: number | null;
  diastolic_bp: number | null;
  weight_kg: number | null;
  bmi: number | null;
};
