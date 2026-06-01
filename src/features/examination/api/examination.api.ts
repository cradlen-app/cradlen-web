import { apiAuthFetch } from "@/infrastructure/http/api";

/**
 * Specialty-agnostic envelope for the Examination tab. Backend returns
 * a flattened view across `VisitEncounter`, `VisitVitals`, `VisitObgynEncounter`,
 * `VisitInvestigation[]`, and `Prescription.items[]` with a single
 * `examination_version` token for `If-Match` optimistic concurrency. The
 * renderer is template-driven, so extra keys on the envelope are tolerated.
 */
export interface VisitExaminationEnvelope {
  visit_id: string;
  examination_version: number;
  updated_at: string;
  [key: string]: unknown;
}

export interface PatchVisitExaminationArgs {
  endpointPath: string;
  body: Record<string, unknown>;
}

export function getVisitExamination(
  endpointPath: string,
  signal?: AbortSignal,
): Promise<{ data: VisitExaminationEnvelope }> {
  return apiAuthFetch<{ data: VisitExaminationEnvelope }>(endpointPath, { signal });
}

export function patchVisitExamination({
  endpointPath,
  body,
}: PatchVisitExaminationArgs): Promise<{ data: VisitExaminationEnvelope }> {
  return apiAuthFetch<{ data: VisitExaminationEnvelope }>(endpointPath, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}