import { buildSubmission } from "@/builder/templates/submission-builder";
import type { ExecutionSnapshot } from "@/builder/templates/submission-builder";
import type { FormTemplateDto } from "@/builder/templates/template.types";

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
