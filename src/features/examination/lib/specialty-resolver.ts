/**
 * Resolve a specialty code (e.g. "GYN") to the visit-examination template
 * code and API endpoint path. Convention-driven, mirroring
 * `patient-history/lib/specialty-resolver.ts`: a new specialty just needs
 * to publish `<specialty>_examination` + `/visits/:id/<specialty>-examination`.
 */

export interface SpecialtyExaminationConfig {
  /** FormTemplate.code to fetch from `/v1/form-templates/{code}`. */
  templateCode: string;
  /** GET/PATCH URL relative to /v1 with the visit id baked in. */
  endpointPath: string;
  /** Lower-case slug derived from the specialty code; useful for analytics. */
  slug: string;
}

/**
 * Specialty-code overrides for cases where the published template/endpoint
 * slug doesn't match the bare `<specialty.code.toLowerCase()>_examination`
 * convention. Add entries only when needed.
 *
 *   GYN's examination is published as `obgyn_examination` + `/examination`
 *   because the OB/GYN vertical owns the visit-level surface, while the
 *   `Specialty.code` value persisted on Visit is "GYN".
 */
const SPECIALTY_OVERRIDES: Record<
  string,
  { templateCode: string; endpointSlug: string }
> = {
  GYN: { templateCode: "obgyn_examination", endpointSlug: "examination" },
};

export function resolveSpecialtyExamination(
  specialtyCode: string | null | undefined,
  visitId: string,
): SpecialtyExaminationConfig | null {
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
      endpointPath: `/visits/${visitId}/${override.endpointSlug}`,
    };
  }

  return {
    slug,
    templateCode: `${slug}_examination`,
    endpointPath: `/visits/${visitId}/${slug}-examination`,
  };
}
