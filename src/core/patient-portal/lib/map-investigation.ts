/**
 * Boundary mapping from the backend investigation wire shape
 * (`ApiPatientInvestigationItem`) to the portal's `PortalTest` view model.
 *
 * Pure (no React/i18n). Result content is exposed by the backend only once the
 * investigation is REVIEWED; this mapper mirrors that gate defensively — review
 * details and the result attachment are surfaced only for `REVIEWED` rows.
 */
import type {
  LabCategory,
  PortalTest,
} from "../types/patient-portal.types";
import type { ApiPatientInvestigationItem } from "../data/patient-investigations.api.types";

/** Backend `LabTestCategory` (LAB | IMAGING | OTHER) → the card's label key. */
function mapCategory(type: ApiPatientInvestigationItem["type"]): LabCategory {
  switch (type) {
    case "LAB":
      return "lab";
    case "IMAGING":
      return "imaging";
    default:
      return "other";
  }
}

export function mapApiInvestigation(
  item: ApiPatientInvestigationItem,
): PortalTest {
  const reviewed = item.status === "REVIEWED";
  const branchName = item.branch_name ?? "";

  return {
    id: item.id,
    name: item.test_name,
    date: item.ordered_at,
    doctorName: item.ordered_by_name ?? "",
    category: mapCategory(item.type),
    notes: item.instructions ?? undefined,
    status: reviewed ? "reviewed" : "pending",
    clinic: { id: branchName, name: branchName },
    organizationName: item.organization_name ?? undefined,
    resultUrl: reviewed ? (item.result_attachment_url ?? undefined) : undefined,
    review: reviewed
      ? {
          date: item.reviewed_at ?? item.ordered_at,
          notes: item.result_text ?? undefined,
          reviewerName: item.reviewed_by_name ?? undefined,
        }
      : undefined,
  };
}
