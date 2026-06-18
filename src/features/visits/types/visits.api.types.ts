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

// ── Prescription printout ───────────────────────────────────────────────────
// The printed prescription ("paper") is data-driven: the print endpoint returns
// `{ template, document }`. `template.layout.blocks` is an ordered list the
// frontend renders through a block registry, so a future custom template just
// supplies different blocks — no new rendering code per template.

export type PrescriptionBlockType =
  | "header"
  | "doctor"
  | "patient"
  | "diagnosis"
  | "medications"
  | "notes"
  | "signature"
  | "footer";

export type PrescriptionBlock = {
  type: PrescriptionBlockType;
  /** Defaults to true; an explicit `false` hides the block. */
  visible?: boolean;
  options?: Record<string, unknown>;
};

export type PrescriptionTemplateLayout = {
  blocks: PrescriptionBlock[];
};

export type PrescriptionTemplate = {
  id: string;
  name: string;
  layout: PrescriptionTemplateLayout;
};

export type PrescriptionDocumentItem = {
  name: string;
  generic_name?: string | null;
  strength?: string | null;
  form?: string | null;
  dose: string;
  route?: string | null;
  frequency: string;
  duration?: string | null;
  instructions?: string | null;
};

export type PrescriptionDocument = {
  prescribed_at: string;
  notes?: string | null;
  organization: {
    id: string;
    name: string;
    logo_object_key?: string | null;
    /** Presigned GET URL for the logo; render directly. */
    logo_image_url?: string | null;
  };
  branch: {
    id: string;
    name: string;
    address: string;
    city: string;
    governorate: string;
    country?: string | null;
  };
  doctor: {
    id: string;
    name: string;
    specialty?: string | null;
    license_number?: string | null;
    signature_object_key?: string | null;
  };
  patient: {
    id: string;
    full_name: string;
    phone_number?: string | null;
    date_of_birth?: string | null;
  };
  diagnosis: {
    chief_complaint?: string | null;
    provisional_diagnosis?: string | null;
  };
  items: PrescriptionDocumentItem[];
};

export type PrescriptionPrint = {
  template: PrescriptionTemplate;
  document: PrescriptionDocument;
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
  /** Specialty captured at booking; drives the patient-history template resolver. */
  specialty_code?: string | null;
  /** Subspecialty captured at booking; the primary examination-template discriminator (falls back to specialty_code). */
  subspecialty_code?: string | null;
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

export type ApiVisitHistoryMedication = {
  name: string;
  dose: string;
};

export type ApiVisitHistoryEntry = {
  id: string;
  appointment_type: "VISIT" | "FOLLOW_UP";
  completed_at: string;
  diagnosis: string | null;
  medications: ApiVisitHistoryMedication[];
  investigations: string[];
};

export type ApiVisitHistoryResponse = {
  data: ApiVisitHistoryEntry[];
  meta: ApiPaginationMeta;
};

// ── Journey timeline (Journey → Episode → Visit tree) ──────────────────────────

export type ApiJourneyTimelineEpisode = {
  id: string;
  name: string;
  order: number;
  status: string;
  started_at: string | null;
  ended_at: string | null;
  visits: ApiVisitHistoryEntry[];
};

export type ApiJourneyTimelineEntry = {
  id: string;
  /** Journey display name (from the journey template, e.g. "Pregnancy"). */
  name: string;
  type: string;
  status: ApiJourneyStatus;
  started_at: string;
  ended_at: string | null;
  episodes: ApiJourneyTimelineEpisode[];
};

export type ApiJourneyTimelineResponse = {
  data: ApiJourneyTimelineEntry[];
  meta: ApiPaginationMeta;
};

export type ApiVitalsTrendPoint = {
  visit_id: string;
  completed_at: string;
  systolic_bp: number | null;
  diastolic_bp: number | null;
  weight_kg: number | null;
  bmi: number | null;
};
