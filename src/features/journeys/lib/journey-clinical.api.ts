import { apiAuthFetch } from "@/infrastructure/http/api";

/**
 * Generic envelope for a journey clinical surface (journey profile +
 * per-visit surveillance), flattened across the journey/episode/visit records
 * the care path declares, with a single `version` token for `If-Match`
 * optimistic concurrency (independent of `examination_version`). Template-driven
 * render, so extra keys are tolerated.
 *
 * The concrete read/write endpoints are provided by the (deferred) pregnancy
 * clinical vertical; this client + the generic tab are dormant until a care
 * path declares a surface.
 */
export interface JourneyClinicalEnvelope {
  journey_id: string;
  version: number;
  [key: string]: unknown;
}

export interface PatchJourneyClinicalArgs {
  visitId: string;
  journeyId: string;
  ifMatchVersion: number;
  body: Record<string, unknown>;
}

const path = (visitId: string, journeyId: string) =>
  `/visits/${encodeURIComponent(visitId)}/journeys/${encodeURIComponent(
    journeyId,
  )}/clinical`;

export function getJourneyClinical(
  visitId: string,
  journeyId: string,
  signal?: AbortSignal,
): Promise<{ data: JourneyClinicalEnvelope }> {
  return apiAuthFetch<{ data: JourneyClinicalEnvelope }>(
    path(visitId, journeyId),
    { signal },
  );
}

export function patchJourneyClinical({
  visitId,
  journeyId,
  ifMatchVersion,
  body,
}: PatchJourneyClinicalArgs): Promise<{ data: JourneyClinicalEnvelope }> {
  return apiAuthFetch<{ data: JourneyClinicalEnvelope }>(
    path(visitId, journeyId),
    {
      method: "PATCH",
      headers: { "If-Match": `version:${ifMatchVersion}` },
      body: JSON.stringify(body),
    },
  );
}
