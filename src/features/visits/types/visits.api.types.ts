// Wire shapes (snake_case) for the visits API.

export type ApiVisitStatus =
  | "SCHEDULED"
  | "CHECKED_IN"
  | "IN_PROGRESS"
  | "IN_CONSULTATION"
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
  marital_status?:
    | "SINGLE"
    | "MARRIED"
    | "DIVORCED"
    | "WIDOWED"
    | "SEPARATED"
    | "ENGAGED"
    | "UNKNOWN";
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
  appointment_type: ApiVisitType;
  priority: ApiVisitPriority;
  status: ApiVisitStatus;
  scheduled_at?: string;
  notes?: string;
  chief_complaint?: string | null;
  chief_complaint_meta?: ChiefComplaintMeta | null;
  vitals?: ApiVitals | null;
  queue_number?: number;
  branch_id?: string;
  /** Specialty captured at booking; drives the patient-history + examination template resolvers. */
  specialty_code?: string | null;
  created_at?: string;
  started_at?: string;
  completed_at?: string;
  assigned_doctor?: {
    id: string;
    /** Doctor's primary specialty (object), or null. */
    specialty?: { id: string; code: string; name: string } | null;
    user: { id: string; first_name: string; last_name: string };
  };
  episode?: {
    id: string;
    journey: {
      patient: { id: string; full_name: string };
      care_path?: { code: string } | null;
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

/**
 * Disambiguation-only row from `GET /patients/search` (the cross-org global
 * lookup). Full PII (national id, DOB, address, full phone) is intentionally NOT
 * returned here — it is revealed per-record on selection via
 * `GET /patients/:id/identity` (see `fetchPatientIdentity`). `phone_last3` = last
 * 3 phone digits, to disambiguate same-name patients.
 */
export type ApiPatientSearchResult = {
  id: string;
  full_name: string;
  phone_last3: string | null;
};

export type ApiPatientSearchResponse = {
  data: ApiPatientSearchResult[];
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
  last_visit_date?: string | null;
  created_at: string;
  updated_at: string;
  journey: { id: string; type: ApiJourneyType; status: ApiJourneyStatus } | null;
  profile_image_url?: string | null;
};

export type ApiPatientListResponse = {
  data: ApiPatientListItem[];
  meta: ApiPaginationMeta;
};

// ── Patient analytics ─────────────────────────────────────────────────────────

/** A metric's value now vs. at the start of the current month (drives the trend). */
export type ApiPatientStatMetric = { current: number; previous: number };

/**
 * Patient count for one care-path journey, keyed by its journey template (which
 * belongs to a specialty). Data-driven — `name` is the display label and `type`
 * is only an icon hint, so new specialties surface without frontend changes.
 */
export type ApiCarePathStat = {
  journey_template_id: string;
  name: string;
  specialty_id: string;
  specialty_name: string;
  type: ApiJourneyType;
  current: number;
  previous: number;
};

export type ApiPatientStats = {
  total: ApiPatientStatMetric;
  /** Patients added this month vs last month (drives a MoM trend chip). */
  new_this_month: ApiPatientStatMetric;
  by_care_path: ApiCarePathStat[];
};

export type ApiPatientStatsResponse = { data: ApiPatientStats };

/**
 * Monthly visit analytics: each metric is a period flow (attended visits within
 * the current vs the previous calendar month), reusing the `{ current, previous }`
 * shape so the shared trend chip works unchanged. `daily` is the current-month
 * per-day series for the throughput chart.
 */
export type ApiVisitDailyPoint = {
  date: string;
  visits: number;
  follow_ups: number;
};

export type ApiVisitMonthlyStats = {
  total: ApiPatientStatMetric;
  visits: ApiPatientStatMetric;
  follow_ups: ApiPatientStatMetric;
  daily: ApiVisitDailyPoint[];
};

export type ApiVisitMonthlyStatsResponse = { data: ApiVisitMonthlyStats };

// Existing patient booking
export type BookVisitExistingPatientRequest = VisitIntake & {
  patient_id: string;
  assigned_doctor_id: string;
  appointment_type: ApiVisitType;
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
  assigned_doctor_id: string;
  appointment_type: ApiVisitType;
  priority: ApiVisitPriority;
  scheduled_at: string;
  branch_id?: string;
};

export type BookVisitRequest =
  | BookVisitExistingPatientRequest
  | BookVisitNewPatientRequest;

// Visit PATCH — every field optional (partial correction of an existing visit).
// Canonical home for the shape; visits.api.ts and the update hook re-export it.
export type UpdateVisitRequest = VisitIntake & {
  assigned_doctor_id?: string;
  branch_id?: string;
  /**
   * Billable service. Not a Visit column — when it differs from the service
   * captured at booking the backend swaps the booking charge + invoice line
   * (allowed only while the case invoice is unpaid).
   */
  service_id?: string;
  appointment_type?: ApiVisitType;
  priority?: ApiVisitPriority;
  scheduled_at?: string;
  notes?: string | null;
  full_name?: string;
  national_id?: string;
  date_of_birth?: string;
  phone_number?: string;
  address?: string;
  marital_status?:
    | "SINGLE"
    | "MARRIED"
    | "DIVORCED"
    | "WIDOWED"
    | "SEPARATED"
    | "ENGAGED"
    | "UNKNOWN";
};

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


// Concern-scoped type modules, re-exported so the existing
// `visits.api.types` import site (~39 files) is unaffected.
export type * from "./visits-prescription.types";
export type * from "./visits-medical-rep.types";
export type * from "./visits-journey.types";
