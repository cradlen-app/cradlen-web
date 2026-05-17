import { apiAuthFetch } from "@/infrastructure/http/api";

/**
 * Specialty-agnostic envelope. Backend returns the singleton row's columns
 * (JSON sections + scalars) PLUS one array per repeatable section, with a
 * `version` token for `If-Match` optimistic concurrency. The renderer is
 * template-driven, so extra keys are tolerated.
 */
export interface PatientHistoryEnvelope {
  patient_id: string;
  version: number;
  updated_at: string;
  [key: string]: unknown;
}

export interface PatchPatientHistoryArgs {
  endpointPath: string;
  ifMatchVersion: number;
  body: Record<string, unknown>;
}

export function getPatientHistory(
  endpointPath: string,
): Promise<{ data: PatientHistoryEnvelope }> {
  return apiAuthFetch<{ data: PatientHistoryEnvelope }>(endpointPath);
}

export function patchPatientHistory({
  endpointPath,
  ifMatchVersion,
  body,
}: PatchPatientHistoryArgs): Promise<{ data: PatientHistoryEnvelope }> {
  return apiAuthFetch<{ data: PatientHistoryEnvelope }>(endpointPath, {
    method: "PATCH",
    headers: { "If-Match": `version:${ifMatchVersion}` },
    body: JSON.stringify(body),
  });
}