/**
 * Resolve the visit-examination template + API endpoint for a visit.
 *
 * Two axes:
 *  - **endpointPath** (the examination read/write route) is **specialty-driven**.
 *    It is the real backend route and the data envelope shape is per specialty,
 *    so it never varies by subspecialty.
 *  - **templateCode** (which form variant renders) is **subspecialty-driven**,
 *    falling back to the specialty template. The org specialty is never used to
 *    pick the template.
 *
 * Convention-driven, mirroring `patient-history/lib/specialty-resolver.ts`: a new
 * specialty just publishes `<specialty>_examination` + `/visits/:id/<specialty>-examination`;
 * a new subspecialty variant publishes `<subspecialty>_examination` and is loaded
 * automatically (with a 404-safe fallback to the specialty template handled by the
 * caller via `fallbackTemplateCode`).
 */

export interface SpecialtyExaminationConfig {
  /** FormTemplate.code to fetch from `/v1/form-templates/{code}`. */
  templateCode: string;
  /**
   * Specialty-level template to load when `templateCode` is a subspecialty
   * variant that isn't published (404). Null when `templateCode` is already the
   * specialty template (nothing to fall back to).
   */
  fallbackTemplateCode: string | null;
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

/**
 * Subspecialty-code overrides for the template code, when it doesn't match the
 * bare `<subspecialty.code.toLowerCase()>_examination` convention. Add entries
 * only when needed; an unknown subspecialty still resolves by convention and
 * degrades to the specialty template if that variant isn't published.
 */
const SUBSPECIALTY_OVERRIDES: Record<string, { templateCode: string }> = {};

function specialtyTemplateCode(upperSpecialty: string, slug: string): string {
  return SPECIALTY_OVERRIDES[upperSpecialty]?.templateCode ?? `${slug}_examination`;
}

function subspecialtyTemplateCode(subspecialtyCode: string): string {
  const upper = subspecialtyCode.toUpperCase();
  const slug = subspecialtyCode.toLowerCase();
  return SUBSPECIALTY_OVERRIDES[upper]?.templateCode ?? `${slug}_examination`;
}

export function resolveSpecialtyExamination(
  subspecialtyCode: string | null | undefined,
  specialtyCode: string | null | undefined,
  visitId: string,
): SpecialtyExaminationConfig | null {
  const specialty = specialtyCode?.trim();
  if (!specialty) return null;

  const upper = specialty.toUpperCase();
  const slug = specialty.toLowerCase();
  const override = SPECIALTY_OVERRIDES[upper];
  const endpointSlug = override?.endpointSlug ?? `${slug}-examination`;
  const endpointPath = `/visits/${visitId}/${endpointSlug}`;
  const specialtyCodeTemplate = specialtyTemplateCode(upper, slug);

  const subspecialty = subspecialtyCode?.trim();
  if (subspecialty) {
    return {
      slug,
      templateCode: subspecialtyTemplateCode(subspecialty),
      fallbackTemplateCode: specialtyCodeTemplate,
      endpointPath,
    };
  }

  return {
    slug,
    templateCode: specialtyCodeTemplate,
    fallbackTemplateCode: null,
    endpointPath,
  };
}
