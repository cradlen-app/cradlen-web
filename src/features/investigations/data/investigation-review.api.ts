/**
 * Doctor-side investigation review data access.
 *
 * Wired to the staff endpoints:
 *   GET   /v1/investigations/:id          → load the investigation for review
 *   PATCH /v1/investigations/:id/review   → mark REVIEWED + save the doctor's notes
 *
 * `apiAuthFetch` routes through `/api/backend` with the staff session. The
 * backend wraps responses as `{ data, meta }`.
 */
import { apiAuthFetch } from "@/infrastructure/http/api";
import type {
  ApiInvestigationReview,
  InvestigationReview,
  SubmitInvestigationReviewInput,
} from "../types/investigation-review.types";

/** Backend `LabTestCategory` → the drawer's display label. */
function typeLabel(type: ApiInvestigationReview["type"]): string {
  switch (type) {
    case "LAB":
      return "Laboratory Test";
    case "IMAGING":
      return "Imaging";
    default:
      return "Other";
  }
}

function toReview(api: ApiInvestigationReview): InvestigationReview {
  return {
    id: api.id,
    patientName: api.patient_name,
    visitId: api.visit_id,
    status: api.status,
    updatedAt: api.updated_at,
    typeLabel: typeLabel(api.type),
    testName: api.test_name,
    reason: api.reason ?? undefined,
    attachments: api.result_attachments.map((a) => ({
      id: a.id,
      url: a.url,
      contentType: a.content_type ?? undefined,
    })),
    doctorNotes: api.doctor_notes ?? undefined,
  };
}

export async function fetchInvestigationReview(
  id: string,
): Promise<InvestigationReview> {
  const res = await apiAuthFetch<{ data: ApiInvestigationReview }>(
    `/investigations/${id}`,
  );
  return toReview(res.data);
}

export async function submitInvestigationReview({
  id,
  notes,
}: SubmitInvestigationReviewInput): Promise<InvestigationReview> {
  const res = await apiAuthFetch<{ data: ApiInvestigationReview }>(
    `/investigations/${id}/review`,
    { method: "PATCH", body: JSON.stringify({ notes }) },
  );
  return toReview(res.data);
}
