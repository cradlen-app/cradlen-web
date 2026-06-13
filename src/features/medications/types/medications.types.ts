export interface Medication {
  id: string;
  organization_id: string | null;
  code: string;
  name: string;
  generic_name: string | null;
  form: string | null;
  strength: string | null;
  category: string | null;
  company: string | null;
  notes: string | null;
  default_dose_amount: number | null;
  default_dose_unit: string | null;
  default_dose_frequency: string | null;
  default_dose_route: string | null;
  added_by_id: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  total_prescriptions: number;
  top_prescribers: Array<{
    profile_id: string;
    full_name: string;
    count: number;
  }>;
  medical_reps: Array<{
    id: string;
    full_name: string;
    company_name: string;
  }>;
}

export interface MedicationFacets {
  categories: string[];
  forms: string[];
}

export interface MedicationListMeta {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface MedicationListResponse {
  data: Medication[];
  meta: MedicationListMeta;
}

export interface CreateMedicationRequest {
  code: string;
  name: string;
  generic_name?: string;
  form?: string;
  strength?: string;
  category?: string;
  company?: string;
  notes?: string;
  default_dose_amount?: number;
  default_dose_unit?: string;
  default_dose_frequency?: string;
  default_dose_route?: string;
  medical_rep_id?: string;
}

export interface UpdateMedicationRequest {
  name?: string;
  generic_name?: string;
  form?: string;
  strength?: string;
  category?: string;
  company?: string;
  notes?: string;
  default_dose_amount?: number;
  default_dose_unit?: string;
  default_dose_frequency?: string;
  default_dose_route?: string;
  medical_rep_id?: string | null;
}
