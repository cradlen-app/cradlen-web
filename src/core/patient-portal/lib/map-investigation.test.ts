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
    result_attachments: [
      {
        id: "att-1",
        url: "https://files.example/result.pdf",
        content_type: "application/pdf",
        uploaded_at: "2026-05-22T10:00:00.000Z",
        source: "CLINIC",
      },
    ],
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

  it("maps result attachments (trusting the backend's visibility) and review when REVIEWED", () => {
    const test = mapApiInvestigation(makeItem());

    expect(test.results).toEqual([
      {
        id: "att-1",
        url: "https://files.example/result.pdf",
        contentType: "application/pdf",
        source: "CLINIC",
      },
    ]);
    expect(test.review).toEqual({
      date: "2026-05-22T11:00:00.000Z",
      notes: "Hb 12.1 g/dL — within range",
      reviewerName: "Dr. Omar Saleh",
    });
  });

  it("surfaces a patient-uploaded result before review, with no clinician review", () => {
    const test = mapApiInvestigation(
      makeItem({
        status: "RESULTED",
        result_attachments: [
          {
            id: "att-2",
            url: "https://files.example/mine.jpg",
            content_type: "image/jpeg",
            uploaded_at: "2026-05-21T09:00:00.000Z",
            source: "PATIENT",
          },
        ],
      }),
    );

    expect(test.status).toBe("pending");
    expect(test.results).toHaveLength(1);
    expect(test.results[0].url).toBe("https://files.example/mine.jpg");
    expect(test.review).toBeUndefined();
  });

  it("maps an empty attachments array to no results", () => {
    const test = mapApiInvestigation(
      makeItem({ status: "ORDERED", result_attachments: [] }),
    );
    expect(test.results).toEqual([]);
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
