// Wire shapes (snake_case) for the proposed visits/schedule API.
// When the backend lands, these stay; only the lib/visits.api.ts dispatch flips.

export type ApiVisitStatus =
  | "pending"
  | "waiting"
  | "in_progress"
  | "completed"
  | "cancelled";

export type ApiVisitType = "visit" | "follow_up" | "medical_rep";

export type ApiVisitPriority = "normal" | "emergency";

export type ApiScheduleEventKind = "visit" | "appointment" | "meeting" | "break";

export type ApiVisitPatient = {
  id: string;
  first_name: string;
  last_name: string;
  code?: string;
  phone?: string;
  address?: string;
};

export type ApiVisit = {
  id: string;
  branch_id: string;
  queue_number?: number;
  patient: ApiVisitPatient;
  type: ApiVisitType;
  status: ApiVisitStatus;
  priority: ApiVisitPriority;
  assigned_doctor_id?: string;
  assigned_doctor_name?: string;
  complaint?: string;
  notes?: string;
  created_at: string;
  scheduled_at?: string;
  started_at?: string;
  completed_at?: string;
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
  total_pages: number;
};

export type ApiVisitListResponse = {
  data: ApiVisit[];
  meta: ApiPaginationMeta;
};

export type ApiVisitResponse = { data: ApiVisit };
export type ApiVisitStatsResponse = { data: ApiVisitStats };
export type ApiCurrentVisitResponse = { data: ApiVisit | null };

export type ApiScheduleEvent = {
  id: string;
  branch_id: string;
  title: string;
  kind: ApiScheduleEventKind;
  patient_name?: string;
  doctor_ids?: string[];
  doctor_names?: string[];
  start_time: string; // ISO datetime
  end_time: string; // ISO datetime
  notes?: string;
};

export type ApiScheduleResponse = { data: ApiScheduleEvent[] };

export type CreateVisitRequest = {
  patient_id?: string;
  new_patient?: {
    first_name: string;
    last_name: string;
    phone?: string;
    code?: string;
  };
  type: ApiVisitType;
  priority: ApiVisitPriority;
  assigned_doctor_id?: string;
  complaint?: string;
  scheduled_at?: string;
};

export type UpdateVisitStatusRequest = {
  status: ApiVisitStatus;
};
