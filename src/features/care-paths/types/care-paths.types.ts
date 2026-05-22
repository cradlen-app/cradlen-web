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
}
