import { describe, expect, it } from "vitest";

import type { ApiPatientVisitItem } from "../data/patient-visits.api.types";
import { mapApiVisit } from "./map-visit";

function makeItem(
  overrides: Partial<ApiPatientVisitItem> = {},
): ApiPatientVisitItem {
  return {
    id: "visit-1",
    visit_date: "2026-05-20T09:00:00.000Z",
    completed_at: "2026-05-20T10:30:00.000Z",
    appointment_type: "VISIT",
    priority: "NORMAL",
    status: "COMPLETED",
    specialty_code: "OBGYN",
    doctor_name: "Dr. Sara Mansour",
    organization_name: "Jasmin Clinic",
    branch_name: "Cradlen Maadi",
    diagnoses: [
      { code: "N80.0", description: "Endometriosis", is_primary: true },
    ],
    medications: [
      {
        name: "Paracetamol",
        dose: "500mg",
        frequency: "TID",
        route: "oral",
        duration: "5 days",
        instructions: "after meals",
      },
    ],
    investigations: [{ name: "CBC", status: "RESULTED" }],
    ...overrides,
  };
}

describe("mapApiVisit", () => {
  it("maps core fields, using completed_at as the timeline date", () => {
    const visit = mapApiVisit(makeItem());

    expect(visit).toMatchObject({
      id: "visit-1",
      date: "2026-05-20T10:30:00.000Z",
      doctorName: "Dr. Sara Mansour",
      specialty: "OBGYN",
      status: "completed",
      type: "VISIT",
      priority: "normal",
      organizationName: "Jasmin Clinic",
    });
    expect(visit.clinic).toEqual({
      id: "Cradlen Maadi",
      name: "Cradlen Maadi",
    });
  });

  it("falls back to visit_date when completed_at is empty", () => {
    const visit = mapApiVisit(
      makeItem({ completed_at: "" as unknown as string }),
    );
    expect(visit.date).toBe("2026-05-20T09:00:00.000Z");
  });

  it("maps EMERGENCY priority and FOLLOW_UP type", () => {
    const visit = mapApiVisit(
      makeItem({ priority: "EMERGENCY", appointment_type: "FOLLOW_UP" }),
    );
    expect(visit.priority).toBe("emergency");
    expect(visit.type).toBe("FOLLOW_UP");
  });

  it("orders the primary diagnosis first and joins descriptions", () => {
    const visit = mapApiVisit(
      makeItem({
        diagnoses: [
          { code: "Z34.0", description: "Supervision of pregnancy", is_primary: false },
          { code: "N80.0", description: "Endometriosis", is_primary: true },
        ],
      }),
    );
    expect(visit.diagnosis).toBe("Endometriosis, Supervision of pregnancy");
  });

  it("leaves diagnosis undefined when there are none", () => {
    const visit = mapApiVisit(makeItem({ diagnoses: [] }));
    expect(visit.diagnosis).toBeUndefined();
  });

  it("composes medication display strings from name/dose/frequency", () => {
    const visit = mapApiVisit(
      makeItem({
        medications: [
          {
            name: "Paracetamol",
            dose: "500mg",
            frequency: "TID",
            route: null,
            duration: null,
            instructions: null,
          },
          {
            name: "Herbal X",
            dose: "1 cap",
            frequency: "",
            route: null,
            duration: null,
            instructions: null,
          },
        ],
      }),
    );
    expect(visit.medications).toEqual(["Paracetamol 500mg TID", "Herbal X 1 cap"]);
  });

  it("extracts investigation names and drops empty ones", () => {
    const visit = mapApiVisit(
      makeItem({
        investigations: [
          { name: "CBC", status: "RESULTED" },
          { name: "", status: "ORDERED" },
        ],
      }),
    );
    expect(visit.investigations).toEqual(["CBC"]);
  });

  it("maps absent branch/organization to empty clinic / undefined org", () => {
    const visit = mapApiVisit(
      makeItem({ branch_name: null, organization_name: null }),
    );
    expect(visit.clinic).toEqual({ id: "", name: "" });
    expect(visit.organizationName).toBeUndefined();
  });
});
