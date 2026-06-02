export interface MedicalRep {
  id: string;
  full_name: string;
  company_name: string | null;
  national_id: string | null;
  phone_number: string | null;
  specialty_focus: string | null;
  products: string[];
  last_visit_date: string | null;
  visits_count: number;
}

export interface MedicalRepListMeta {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface MedicalRepListResponse {
  data: MedicalRep[];
  meta: MedicalRepListMeta;
}
