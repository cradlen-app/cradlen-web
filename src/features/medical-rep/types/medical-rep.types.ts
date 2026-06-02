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

export interface MedicalRepVisitHistoryProduct {
  id: string;
  name: string;
}

export interface MedicalRepVisitHistoryItem {
  id: string;
  scheduled_at: string;
  completed_at: string | null;
  status: string;
  purpose: string | null;
  outcome: string | null;
  samples_received: boolean;
  follow_up_date: string | null;
  notes: string | null;
  products: MedicalRepVisitHistoryProduct[];
}

export interface MedicalRepVisitHistoryResponse {
  data: MedicalRepVisitHistoryItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages?: number;
  };
}

export interface MedicalRepListResponse {
  data: MedicalRep[];
  meta: MedicalRepListMeta;
}

/** Raw rep record from `GET /medical-reps/:id`. */
export interface MedicalRepDetail {
  id: string;
  organization_id: string;
  full_name: string;
  company_name: string;
  national_id: string | null;
  phone_number: string | null;
  email: string | null;
  specialty_focus: string | null;
  notes: string | null;
}

/** A medication linked to a rep, from `GET /medical-reps/:repId/medications`. */
export interface MedicalRepMedicationLink {
  medication_id: string;
  code: string;
  name: string;
}
