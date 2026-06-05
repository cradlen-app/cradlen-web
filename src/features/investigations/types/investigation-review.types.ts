/**
 * Doctor-side investigation review view model.
 *
 * Mirrors the backend investigation shape used by the patient portal
 * (`src/core/patient-portal/data/patient-investigations.api.types.ts`) so that
 * swapping the mock data layer for the real staff endpoint is mechanical.
 */

/** Backend `InvestigationStatus`. */
export type InvestigationStatus =
  | "ORDERED"
  | "RESULTED"
  | "REVIEWED"
  | "CANCELLED";

/** A patient-uploaded result file shown to the reviewing doctor. */
export interface InvestigationAttachment {
  id: string;
  /** Presigned/mock GET URL. */
  url: string;
  contentType?: string;
}

/** Everything the review drawer renders for one investigation. */
export interface InvestigationReview {
  id: string;
  patientName: string;
  visitId: string;
  /** Workflow status, shown read-only. */
  status: InvestigationStatus;
  /** ISO timestamp of the last update. */
  updatedAt: string;
  /** Display label, e.g. "Laboratory Test". */
  typeLabel: string;
  testName: string;
  reason?: string;
  /** Patient-uploaded result files (images/PDFs). */
  attachments: InvestigationAttachment[];
  /** The doctor's review notes, if already saved. */
  doctorNotes?: string;
}

/** Payload the Save action submits. */
export interface SubmitInvestigationReviewInput {
  id: string;
  notes: string;
}

// --- Backend wire shapes (snake_case) — mirror `InvestigationReviewDto` --------

export interface ApiInvestigationAttachment {
  id: string;
  url: string;
  content_type: string | null;
}

export interface ApiInvestigationReview {
  id: string;
  patient_name: string;
  visit_id: string;
  status: InvestigationStatus;
  /** LAB | IMAGING | OTHER. */
  type: "LAB" | "IMAGING" | "OTHER" | null;
  test_name: string;
  reason: string | null;
  updated_at: string;
  doctor_notes: string | null;
  result_attachments: ApiInvestigationAttachment[];
}
