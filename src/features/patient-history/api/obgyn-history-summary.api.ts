import { apiAuthFetch } from "@/infrastructure/http/api";

export type SummarySignalSeverity = "high" | "medium" | "low" | "positive";
export type SummarySectionStatus = "positive" | "negative" | "unknown";

export interface Gtpal {
  g: number;
  t: number;
  p: number;
  a: number;
  l: number;
}

export interface HistorySummaryIdentifier {
  age: number | null;
  gtpal: Gtpal | null;
  gtpal_label: string | null;
  lmp: string | null;
}

export interface HistorySummarySection {
  code: string;
  label: string;
  items: string[];
  status: SummarySectionStatus;
}

export interface HistorySummaryFlag {
  label: string;
  severity: SummarySignalSeverity;
}

/**
 * Server-computed standard OB/GYN history summary: GTPAL identifier +
 * problem-oriented sections (with pertinent negatives) + prioritized flags +
 * a narrative. Mirrors the backend `ObgynHistorySummaryDto`.
 */
export interface ObgynHistorySummary {
  history_exists: boolean;
  identifier: HistorySummaryIdentifier;
  sections: HistorySummarySection[];
  flags: HistorySummaryFlag[];
  narrative: string;
}

export function fetchObgynHistorySummary(
  patientId: string,
): Promise<{ data: ObgynHistorySummary }> {
  return apiAuthFetch<{ data: ObgynHistorySummary }>(
    `/patients/${patientId}/obgyn-history-summary`,
  );
}
