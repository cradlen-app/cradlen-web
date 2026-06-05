/**
 * Wire shapes for `GET /v1/patient-portal/visits`.
 *
 * Mirror the backend `PatientVisitItemDto` (and its child DTOs) exactly. The
 * portal renders the `PortalVisit` view model instead — see `lib/map-visit.ts`
 * for the boundary mapping.
 */

export interface ApiPatientVisitDiagnosis {
  /** ICD-10 code, e.g. "N80.0". */
  code: string;
  description: string;
  is_primary: boolean;
}

export interface ApiPatientVisitMedication {
  name: string;
  dose: string;
  frequency: string;
  route: string | null;
  duration: string | null;
  instructions: string | null;
}

export interface ApiPatientVisitInvestigation {
  name: string;
  /** ORDERED | RESULTED | REVIEWED | CANCELLED. */
  status: string;
}

export interface ApiPatientVisitItem {
  id: string;
  /** ISO timestamp the visit was scheduled for. */
  visit_date: string;
  /** ISO timestamp the visit was completed. */
  completed_at: string;
  appointment_type: "VISIT" | "FOLLOW_UP";
  priority: "NORMAL" | "EMERGENCY";
  status: string;
  specialty_code: string | null;
  /** Already formatted as "Dr. <first> <last>". */
  doctor_name: string | null;
  organization_name: string | null;
  branch_name: string | null;
  diagnoses: ApiPatientVisitDiagnosis[];
  medications: ApiPatientVisitMedication[];
  investigations: ApiPatientVisitInvestigation[];
}

export interface ApiPatientVisitsResponse {
  data: ApiPatientVisitItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
