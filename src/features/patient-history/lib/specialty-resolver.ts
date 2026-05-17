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
  /** Lower-case slug derived from the specialty code; useful for analytics. */
  slug: string;
}

/**
 * Specialty-code overrides for cases where the published template/endpoint
 * slug doesn't match the bare `<specialty.code.toLowerCase()>_patient_history`
 * convention. Add entries only when needed; the empty default lets new
 * specialties land without any FE change.
 *
 *   GYN's history is published as `obgyn_patient_history` + `/obgyn-history`
 *   because the OB/GYN vertical owns both obstetrics and gynecology under
 *   one form, while the `Specialty.code` value persisted on Visit is "GYN".
 */
const SPECIALTY_OVERRIDES: Record<
  string,
  { templateCode: string; endpointSlug: string }
> = {
  GYN: { templateCode: "obgyn_patient_history", endpointSlug: "obgyn-history" },
};

export function resolveSpecialtyHistory(
  specialtyCode: string | null | undefined,
  patientId: string,
): SpecialtyHistoryConfig | null {
  if (!specialtyCode) return null;
  const trimmed = specialtyCode.trim();
  if (!trimmed) return null;
  const upper = trimmed.toUpperCase();
  const slug = trimmed.toLowerCase();

  const override = SPECIALTY_OVERRIDES[upper];
  if (override) {
    return {
      slug,
      templateCode: override.templateCode,
      endpointPath: `/patients/${patientId}/${override.endpointSlug}`,
    };
  }

  return {
    slug,
    templateCode: `${slug}_patient_history`,
    endpointPath: `/patients/${patientId}/${slug}-history`,
  };
}