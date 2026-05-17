/**
 * Resolve a specialty code (e.g. "OBGYN") to the patient-history template
 * code and API endpoint path. Convention-driven so adding a new specialty
 * doesn't require touching the resolver — the backend just publishes
 * `<specialty>_patient_history` and `/patients/:id/<specialty>-history`.
 */

export interface SpecialtyHistoryConfig {
  /** FormTemplate.code to fetch from `/v1/form-templates/{code}`. */
  templateCode: string;
  /** GET/PATCH URL relative to /v1 with the patient id baked in. */
  endpointPath: string;
  /** Lower-case slug used to build the paths; useful for analytics. */
  slug: string;
}

export function resolveSpecialtyHistory(
  specialtyCode: string | null | undefined,
  patientId: string,
): SpecialtyHistoryConfig | null {
  if (!specialtyCode) return null;
  const slug = specialtyCode.trim().toLowerCase();
  if (!slug) return null;
  return {
    slug,
    templateCode: `${slug}_patient_history`,
    endpointPath: `/patients/${patientId}/${slug}-history`,
  };
}