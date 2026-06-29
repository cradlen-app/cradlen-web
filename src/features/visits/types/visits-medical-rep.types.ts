import type {
  ApiPaginationMeta,
  ApiVisitPriority,
} from "./visits.api.types";

// ── Medical-rep visit booking ─────────────────────────────────────────────────

export type ApiMedicalRep = {
  id: string;
  organization_id: string;
  full_name: string;
  national_id: string | null;
  phone_number: string | null;
  email: string | null;
  company_name: string;
  notes: string | null;
  created_at: string;
};

export type ApiMedicalRepVisitStatus =
  | "SCHEDULED"
  | "CHECKED_IN"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export type ApiMedicalRepVisit = {
  id: string;
  medical_rep_id: string;
  organization_id: string;
  branch_id: string;
  assigned_doctor_id: string;
  scheduled_at: string;
  status: ApiMedicalRepVisitStatus;
  priority: ApiVisitPriority;
  notes: string | null;
  queue_number?: number | null;
  checked_in_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_at?: string;
  medical_rep?: ApiMedicalRep | null;
  assigned_doctor?: {
    id: string;
    user: { id: string; first_name: string; last_name: string };
  };
  medications?: { medication_id: string }[];
};

export type ApiMedicalRepVisitListResponse = {
  data: ApiMedicalRepVisit[];
  meta: ApiPaginationMeta;
};

export type ApiMedicalRepVisitResponse = { data: ApiMedicalRepVisit };

export type ApiMedicalRepVisitArrayResponse = { data: ApiMedicalRepVisit[] };

export type UpdateMedicalRepVisitRequest = {
  assigned_doctor_id?: string;
  branch_id?: string;
  scheduled_at?: string;
  priority?: ApiVisitPriority;
  notes?: string;
  medication_ids?: string[];
  full_name?: string;
  national_id?: string;
  phone_number?: string;
  email?: string;
  company_name?: string;
};

export type UpdateMedicalRepVisitStatusRequest = {
  status: ApiMedicalRepVisitStatus;
  reason?: string;
};

// Existing rep — supply medical_rep_id only.
export type BookMedicalRepVisitExistingRequest = {
  medical_rep_id: string;
  assigned_doctor_id: string;
  scheduled_at: string;
  branch_id?: string;
  priority?: ApiVisitPriority;
  medication_ids?: string[];
  notes?: string;
};

// New rep — supply identity fields (full_name + company_name required).
export type BookMedicalRepVisitNewRequest = {
  full_name: string;
  company_name: string;
  national_id?: string;
  phone_number?: string;
  email?: string;
  assigned_doctor_id: string;
  scheduled_at: string;
  branch_id?: string;
  priority?: ApiVisitPriority;
  medication_ids?: string[];
  notes?: string;
};

export type BookMedicalRepVisitRequest =
  | BookMedicalRepVisitExistingRequest
  | BookMedicalRepVisitNewRequest;

export type BookMedicalRepVisitResponse = {
  data: {
    rep: ApiMedicalRep;
    visit: ApiMedicalRepVisit;
  };
};

