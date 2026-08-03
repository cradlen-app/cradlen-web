import { buildSubmission } from "@/builder/templates/submission-builder";
import type { ExecutionSnapshot } from "@/builder/templates/submission-builder";
import type { FormTemplateDto } from "@/builder/templates/template.types";
import { VISIT_PRIORITY } from "./visits.constants";
import type {
  ApiVisitType,
  QuickStartVisitRequest,
} from "../types/visits.api.types";

type BuildPayloadOptions = {
  /** True when submitting an edit (PATCH) rather than a new booking. */
  isEdit: boolean;
  /** Active branch to stamp on a new booking (ignored in edit mode). */
  branchId?: string | null;
};

/**
 * Turns the form-execution snapshot into the wire payload for a visit
 * book/update request. Centralizes the two visit-specific normalizations the
 * raw `buildSubmission` output needs:
 *
 *  - `scheduled_at`: the DATETIME input emits `YYYY-MM-DDTHH:mm` from
 *    `datetime-local`; expand it to a full ISO timestamp.
 *  - edit mode: identity-search hosts (full_name, …) submit their typed text via
 *    the create-namespace binding, and the URL already identifies the visit — so
 *    strip any leftover LOOKUP id (`patient_id` / `medical_rep_id`).
 */
export function buildVisitPayload(
  template: FormTemplateDto,
  snapshot: ExecutionSnapshot,
  { isEdit, branchId }: BuildPayloadOptions,
): Record<string, unknown> {
  const body = buildSubmission(template, snapshot);

  if (!isEdit) body.branch_id = branchId;

  if (
    typeof body.scheduled_at === "string" &&
    body.scheduled_at.length === 16
  ) {
    const d = new Date(body.scheduled_at);
    if (!Number.isNaN(d.getTime())) body.scheduled_at = d.toISOString();
  }

  if (isEdit) {
    delete body.patient_id;
    delete body.medical_rep_id;
  }

  return body;
}

type QuickStartInput = {
  patientId: string;
  /**
   * The *doctor's own* specialty code — not the organization's. The API's
   * `assertDoctorSpecialty` matches `specialty_code` against the assigned
   * doctor's profile, so passing the org's first specialty 400s for any doctor
   * whose specialty isn't first in that list.
   */
  specialtyCode: string;
  serviceId: string;
  /** The caller's own profile id: self-booking is the only shape allowed. */
  assignedDoctorId: string;
  appointmentType: ApiVisitType;
  branchId?: string | null;
  chiefComplaint?: string;
};

/**
 * Builds the wire payload for a doctor's self-start booking. The single place
 * that knows this shape, so an API DTO change surfaces as one compile error.
 *
 * `scheduled_at` is stamped here (call at submit time, not dialog-open time) and
 * priority is always NORMAL — a walk-in the doctor is about to see needs no
 * triage flag.
 */
export function buildQuickStartVisitPayload({
  patientId,
  specialtyCode,
  serviceId,
  assignedDoctorId,
  appointmentType,
  branchId,
  chiefComplaint,
}: QuickStartInput): QuickStartVisitRequest {
  const complaint = chiefComplaint?.trim();
  return {
    visitor_type: "PATIENT",
    patient_id: patientId,
    specialty_code: specialtyCode,
    service_id: serviceId,
    assigned_doctor_id: assignedDoctorId,
    appointment_type: appointmentType,
    priority: VISIT_PRIORITY.NORMAL,
    scheduled_at: new Date().toISOString(),
    ...(branchId ? { branch_id: branchId } : {}),
    ...(complaint ? { chief_complaint: complaint } : {}),
    start_now: true,
  };
}
