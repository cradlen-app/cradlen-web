export interface Medication {
  id: string;
  organization_id: string | null;
  code: string;
  name: string;
  generic_name: string | null;
  form: string | null;
  strength: string | null;
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
}

export interface UpdateMedicationRequest {
  name?: string;
  generic_name?: string;
  form?: string;
  strength?: string;
}
