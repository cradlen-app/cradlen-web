/**
 * The optional clinical surface a care path declares. When present, the visit
 * workspace renders one journey tab backed by `template_code`.
 */
export interface JourneyClinicalSurfaceDto {
  template_code: string;
  label: string;
}

/**
 * Descriptor for the journey a visit belongs to (the patient's single active
 * journey for a live visit). Mirrors the backend `JourneyDescriptorDto`. Drives
 * the dynamic journey tab; `clinical_surface` is null when the care path
 * declares no surface (→ no extra tab).
 */
export interface JourneyDescriptorDto {
  journey_id: string;
  episode_id: string;
  care_path_code: string | null;
  specialty_code: string | null;
  label: string | null;
  status: string;
  started_at: string;
  ended_at: string | null;
  clinical_surface: JourneyClinicalSurfaceDto | null;
}
