import { describe, expect, it } from "vitest";

import type { ApiPatientInvestigationItem } from "../data/patient-investigations.api.types";
import { mapApiInvestigation } from "./map-investigation";

function makeItem(
  overrides: Partial<ApiPatientInvestigationItem> = {},
): ApiPatientInvestigationItem {
  return {
    id: "inv-1",
    test_name: "Complete blood count (CBC)",
    type: "LAB",
    status: "REVIEWED",
    ordered_at: "2026-05-20T09:00:00.000Z",
    instructions: "Fast for 8 hours",
    ordered_by_name: "Dr. Sara Mansour",
    reviewed_at: "2026-05-22T11:00:00.000Z",
    reviewed_by_name: "Dr. Omar Saleh",
    result_text: "Hb 12.1 g/dL — within range",
    result_attachment_url: "https://files.example/result.pdf",
    visit_id: "visit-1",
    visit_date: "2026-05-20T08:00:00.000Z",
    organization_name: "Jasmin Clinic",
    branch_name: "Cradlen Maadi",
    ...overrides,
  };
}

describe("mapApiInvestigation", () => {
  it("maps core fields and the clinic provenance", () => {
    const test = mapApiInvestigation(makeItem());

    expect(test).toMatchObject({
      id: "inv-1",
      name: "Complete blood count (CBC)",
      date: "2026-05-20T09:00:00.000Z",
      doctorName: "Dr. Sara Mansour",
      category: "lab",
      notes: "Fast for 8 hours",
      status: "reviewed",
      organizationName: "Jasmin Clinic",
    });
    expect(test.clinic).toEqual({ id: "Cradlen Maadi", name: "Cradlen Maadi" });
  });

  it("exposes review details and the result attachment when REVIEWED", () => {
    const test = mapApiInvestigation(makeItem());

    expect(test.resultUrl).toBe("https://files.example/result.pdf");
    expect(test.review).toEqual({
      date: "2026-05-22T11:00:00.000Z",
      notes: "Hb 12.1 g/dL — within range",
      reviewerName: "Dr. Omar Saleh",
    });
  });

  it("withholds result and review until REVIEWED", () => {
    const test = mapApiInvestigation(makeItem({ status: "RESULTED" }));

    expect(test.status).toBe("pending");
    expect(test.resultUrl).toBeUndefined();
    expect(test.review).toBeUndefined();
  });

  it("maps IMAGING and falls back to 'other' for unknown/absent type", () => {
    expect(mapApiInvestigation(makeItem({ type: "IMAGING" })).category).toBe(
      "imaging",
    );
    expect(mapApiInvestigation(makeItem({ type: null })).category).toBe("other");
  });

  it("maps absent doctor/branch/org to empty / undefined", () => {
    const test = mapApiInvestigation(
      makeItem({
        ordered_by_name: null,
        branch_name: null,
        organization_name: null,
        instructions: null,
      }),
    );
    expect(test.doctorName).toBe("");
    expect(test.clinic).toEqual({ id: "", name: "" });
    expect(test.organizationName).toBeUndefined();
    expect(test.notes).toBeUndefined();
  });
});
