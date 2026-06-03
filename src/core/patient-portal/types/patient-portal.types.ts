/**
 * Patient Portal domain types.
 *
 * These intentionally mirror the shapes of the staff-side API types
 * (`ApiPatient`, `ApiVisit` in `@/features/visits/types/visits.api.types.ts`)
 * so that swapping the mock data layer for real patient-scoped endpoints is a
 * mechanical change. Every aggregated item carries a `clinic` provenance field
 * because a patient's record is unified across all clinics they've visited.
 */

/** A clinic (org/branch) a patient has been seen at. Used for provenance tags. */
export interface Clinic {
  id: string;
  name: string;
  city?: string;
}

/**
 * A profile the logged-in account can view: either the account holder
 * themselves (`self`) or a dependent linked via guardian relationship.
 */
export interface PatientProfile {
  id: string;
  kind: "self" | "dependent";
  fullName: string;
  /** Relation to the account holder, for dependents (e.g. "Daughter"). */
  relation?: string;
  dateOfBirth?: string;
  nationalId?: string;
  /** Emoji avatar placeholder for the prototype. */
  avatar?: string;
  /** Blood group, e.g. "AB+". */
  bloodType?: string;
  /** Height in centimetres. */
  heightCm?: number;
}

export interface VitalsPoint {
  date: string;
  systolic?: number;
  diastolic?: number;
  weightKg?: number;
  bmi?: number;
}

export interface Allergy {
  id: string;
  substance: string;
  reaction?: string;
  severity?: "mild" | "moderate" | "severe";
}

export type VisitStatus = "completed" | "scheduled" | "cancelled";

/** A past or scheduled clinical encounter, surfaced in the health record. */
export interface PortalVisit {
  id: string;
  date: string;
  clinic: Clinic;
  doctorName: string;
  specialty: string;
  reason?: string;
  diagnosis?: string;
  notes?: string;
  status: VisitStatus;
}

export type MedicationStatus = "active" | "past";

export interface PortalMedication {
  id: string;
  name: string;
  genericName?: string;
  dose: string;
  frequency: string;
  prescriberName: string;
  clinic: Clinic;
  startDate: string;
  endDate?: string;
  status: MedicationStatus;
  /** Remaining days in the course (active meds), for the Home preview. */
  daysLeft?: number;
}

/**
 * A test the doctor ordered during a visit. Drives the "Awaiting your results"
 * list, which is the entry point to the upload flow.
 */
export type LabOrderStatus =
  | "awaiting_upload" // doctor ordered it; patient owes a result
  | "pending_review" // patient uploaded; clinic hasn't reviewed yet
  | "result_ready" // a result is available to view
  | "completed";

export type LabCategory = "lab" | "imaging" | "other";

export interface LabOrder {
  id: string;
  name: string;
  category: LabCategory;
  orderedDate: string;
  doctorName: string;
  clinic: Clinic;
  /** The visit this order belongs to — uploads attach back to it. */
  visitId: string;
  status: LabOrderStatus;
  /** Present when a result exists (clinic-published or patient-uploaded). */
  result?: LabResult;
}

export interface LabResult {
  id: string;
  name: string;
  date: string;
  /** Display label, e.g. "Normal", "Review with doctor". */
  summary?: string;
  /** Mock file reference for view/download. */
  fileRef?: string;
}

export type UploadFileType = "pdf" | "image";

export interface UploadFile {
  id: string;
  name: string;
  sizeLabel: string;
  type: UploadFileType;
}

export type DocumentStatus = "pending_review" | "reviewed";

export type DocumentKind = "lab_result" | "scan" | "other";

/**
 * A document the patient uploaded back to a clinic/doctor. When linked to a
 * lab order, it closes the loop on that exact investigation.
 */
export interface PortalDocument {
  id: string;
  title: string;
  kind: DocumentKind;
  files: UploadFile[];
  clinic: Clinic;
  doctorName: string;
  /** Patient (self or dependent) this document is filed under. */
  forPatientId: string;
  /** Visit the upload is attached to. */
  visitId?: string;
  /** Lab order the upload fulfills, when started from "Awaiting your results". */
  labOrderId?: string;
  uploadedAt: string;
  status: DocumentStatus;
  note?: string;
}

export type AppointmentStatus = "upcoming" | "completed" | "cancelled";

export interface Appointment {
  id: string;
  date: string;
  time?: string;
  clinic: Clinic;
  doctorName: string;
  specialty: string;
  type?: string;
  status: AppointmentStatus;
}

export interface Reminder {
  id: string;
  label: string;
  detail?: string;
}

/** Where the patient is in their active care path (journey/episode). */
export interface ActiveJourney {
  name: string;
  stage?: string;
  clinic?: Clinic;
}

/** Aggregated "my health" snapshot for a single patient profile. */
export interface HealthRecord {
  patientId: string;
  visits: PortalVisit[];
  vitals: VitalsPoint[];
  allergies: Allergy[];
  activeJourney?: ActiveJourney;
}

/** Input to create a patient-uploaded document. */
export interface UploadDocumentInput {
  forPatientId: string;
  labOrderId?: string;
  visitId?: string;
  kind: DocumentKind;
  clinicId: string;
  doctorName: string;
  files: UploadFile[];
  note?: string;
}
