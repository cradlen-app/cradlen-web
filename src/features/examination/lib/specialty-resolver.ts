/**
 * Resolve the visit-examination template + API endpoint for a visit.
 *
 * Both axes are **specialty-driven**:
 *  - **endpointPath** (the examination read/write route) is the real backend
 *    route and the data envelope shape is per specialty.
 *  - **templateCode** (which form variant renders) is the specialty template.
 *
 * Convention-driven, mirroring `patient-history/lib/specialty-resolver.ts`: a new
 * specialty just publishes `<specialty>_examination` +
 * `/visits/:id/<specialty>-examination`. (Subspecialty is a doctor credential and
 * does not select clinical templates — the chosen care path drives clinical
 * content, not the subspecialty.)
 */

export interface SpecialtyExaminationConfig {
  /** FormTemplate.code to fetch from `/v1/form-templates/{code}`. */
  templateCode: string;
  /** GET/PATCH URL relative to /v1 with the visit id baked in (specialty-driven). */
  endpointPath: string;
  /** Lower-case specialty slug; useful for analytics. */
  slug: string;
}

/**
 * Specialty-code overrides for cases where the published template/endpoint slug
 * doesn't match the bare `<specialty.code.toLowerCase()>_examination` convention.
 *
 *   OBGYN's examination is published as `obgyn_examination` + `/examination`
 *   (not the convention-derived `/obgyn-examination`) because the controller
 *   route was registered as `visits/:id/examination`.
 */
const SPECIALTY_OVERRIDES: Record<
  string,
  { templateCode: string; endpointSlug: string }
> = {
  OBGYN: { templateCode: "obgyn_examination", endpointSlug: "examination" },
};

export function resolveSpecialtyExamination(
  specialtyCode: string | null | undefined,
  visitId: string,
): SpecialtyExaminationConfig | null {
  const specialty = specialtyCode?.trim();
  if (!specialty) return null;

  const upper = specialty.toUpperCase();
  const slug = specialty.toLowerCase();
  const override = SPECIALTY_OVERRIDES[upper];
  const endpointSlug = override?.endpointSlug ?? `${slug}-examination`;

  return {
    slug,
    templateCode: override?.templateCode ?? `${slug}_examination`,
    endpointPath: `/visits/${visitId}/${endpointSlug}`,
  };
}
