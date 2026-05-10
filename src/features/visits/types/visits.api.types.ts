// Wire shapes (snake_case) for the visits API.

export type ApiVisitStatus =
  | "SCHEDULED"
  | "CHECKED_IN"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export type ApiVisitType = "VISIT" | "FOLLOW_UP" | "MEDICAL_REP";

export type ApiVisitPriority = "NORMAL" | "EMERGENCY";

export type ApiScheduleEventKind = "visit" | "appointment" | "meeting" | "break";

export type ApiPatient = {
  id: string;
  full_name: string;
  national_id?: string;
  date_of_birth?: string;
  phone_number?: string;
  address?: string;
  husband_name?: string;
  is_married?: boolean;
  active_episodes?: { id: string; name: string; order: number }[];
  last_visit_date?: string;
  next_visit_date?: string;
  active_journey_name?: string;
  journey_status?: string;
};

export type VitalsInput = {
  systolic_bp?: number;
  diastolic_bp?: number;
  pulse?: number;
  temperature_c?: number;
  respiratory_rate?: number;
  spo2?: number;
  weight_kg?: number;
  height_cm?: number;
};

export type ApiVitals = VitalsInput & {
  bmi?: number;
};

export type ChiefComplaintMeta = {
  categories?: string[];
  onset?: string;
  duration?: string;
  severity?: string;
};

export type VisitIntake = {
  chief_complaint?: string;
  chief_complaint_meta?: ChiefComplaintMeta;
  vitals?: VitalsInput;
};

export type ApiVisit = {
  id: string;
  visit_type: ApiVisitType;
  priority: ApiVisitPriority;
  status: ApiVisitStatus;
  scheduled_at?: string;
  notes?: string;
  chief_complaint?: string | null;
  chief_complaint_meta?: ChiefComplaintMeta | null;
  vitals?: ApiVitals | null;
  queue_number?: number;
  branch_id?: string;
  created_at?: string;
  started_at?: string;
  completed_at?: string;
  assigned_doctor?: {
    id: string;
    specialty?: string;
    user: { id: string; first_name: string; last_name: string };
  };
  episode?: {
    id: string;
    journey: {
      patient: { id: string; full_name: string };
    };
  };
};

export type ApiVisitStats = {
  total_visits: number;
  visits: number;
  follow_ups: number;
  medical_reps: number;
};

export type ApiPaginationMeta = {
  page: number;
  limit: number;
  total: number;
  total_pages?: number;
  totalPages?: number;
};

export type ApiVisitListResponse = {
  data: ApiVisit[];
  meta: ApiPaginationMeta;
};

export type ApiVisitResponse = { data: ApiVisit };
export type ApiVisitStatsResponse = { data: ApiVisitStats };

export type ApiScheduleEvent = {
  id: string;
  branch_id: string;
  title: string;
  kind: ApiScheduleEventKind;
  patient_name?: string;
  doctor_ids?: string[];
  doctor_names?: string[];
  start_time: string;
  end_time: string;
  notes?: string;
};

export type ApiScheduleResponse = { data: ApiScheduleEvent[] };

export type ApiPatientSearchResponse = {
  data: ApiPatient[];
  meta: ApiPaginationMeta;
};

export type ApiJourneyStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";

export type ApiJourneyType =
  | "PREGNANCY"
  | "GENERAL_GYN"
  | "SURGICAL"
  | "CHRONIC_CONDITION";

export type ApiPatientListItem = {
  id: string;
  full_name: string;
  national_id?: string;
  date_of_birth?: string;
  phone_number?: string;
  address?: string;
  husband_name?: string;
  last_visit_date?: string | null;
  created_at: string;
  updated_at: string;
  journey: { id: string; type: ApiJourneyType; status: ApiJourneyStatus } | null;
};

export type ApiPatientListResponse = {
  data: ApiPatientListItem[];
  meta: ApiPaginationMeta;
};

// Existing patient booking
export type BookVisitExistingPatientRequest = VisitIntake & {
  patient_id: string;
  assigned_doctor_id: string;
  visit_type: ApiVisitType;
  priority: ApiVisitPriority;
  scheduled_at: string;
  branch_id?: string;
};

// New patient booking
export type BookVisitNewPatientRequest = VisitIntake & {
  national_id: string;
  full_name: string;
  date_of_birth: string;
  phone_number: string;
  address?: string;
  is_married: boolean;
  husband_name?: string;
  assigned_doctor_id: string;
  visit_type: ApiVisitType;
  priority: ApiVisitPriority;
  scheduled_at: string;
  branch_id?: string;
};

export type BookVisitRequest =
  | BookVisitExistingPatientRequest
  | BookVisitNewPatientRequest;

export type BookVisitResponse = {
  data: {
    visit: ApiVisit;
    patient: ApiPatient;
    episode: { id: string; name: string } | null;
    journey: { id: string; status: string } | null;
  };
};

export type UpdateVisitStatusRequest = {
  status: ApiVisitStatus;
};
