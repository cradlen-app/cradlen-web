export interface CarePathEpisodeDto {
  id: string;
  code: string;
  name: string;
  order: number;
  organization_id: string | null;
  is_system: boolean;
}

export interface CarePathDto {
  id: string;
  code: string;
  name: string;
  description: string | null;
  specialty_id: string;
  organization_id: string | null;
  is_system: boolean;
  parent_id: string | null;
  order: number;
  episodes: CarePathEpisodeDto[];
  /**
   * Ordered codes of the embedded `history_*` examination sections relevant to
   * this care path (resolved from CarePathHistorySection). Drives which patient-
   * history sections the OB/GYN examination surfaces once this path is chosen.
   */
  history_section_codes: string[];
}
