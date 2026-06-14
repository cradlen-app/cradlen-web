import { describe, expect, it } from "vitest";

import type { PortalMedication } from "../types/patient-portal.types";
import { groupIntoPrescriptions } from "./medications";

function makeMed(overrides: Partial<PortalMedication> = {}): PortalMedication {
  return {
    id: "item-1",
    prescriptionId: "rx-1",
    name: "Folic acid",
    dose: "1 tab",
    frequency: "every 24h",
    prescriberName: "Dr. Sara Mansour",
    clinic: { id: "Cradlen Maadi", name: "Cradlen Maadi" },
    organizationName: "Jasmin Clinic",
    startDate: "2026-05-20T09:00:00.000Z",
    status: "active",
    ...overrides,
  };
}

describe("groupIntoPrescriptions", () => {
  it("collapses items sharing a prescriptionId into one prescription", () => {
    const result = groupIntoPrescriptions([
      makeMed({ id: "a", prescriptionId: "rx-1" }),
      makeMed({ id: "b", prescriptionId: "rx-1", name: "Iron" }),
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("rx-1");
    expect(result[0].items.map((m) => m.id)).toEqual(["a", "b"]);
  });

  it("takes header fields from the group's first item", () => {
    const [rx] = groupIntoPrescriptions([
      makeMed({
        prescriptionId: "rx-9",
        startDate: "2026-05-20T09:00:00.000Z",
        prescriberName: "Dr. Sara Mansour",
        organizationName: "Jasmin Clinic",
      }),
    ]);

    expect(rx).toMatchObject({
      id: "rx-9",
      prescribedAt: "2026-05-20T09:00:00.000Z",
      doctorName: "Dr. Sara Mansour",
      organizationName: "Jasmin Clinic",
    });
    expect(rx.clinic).toEqual({ id: "Cradlen Maadi", name: "Cradlen Maadi" });
  });

  it("sorts prescriptions newest-first by prescribedAt", () => {
    const result = groupIntoPrescriptions([
      makeMed({
        id: "old",
        prescriptionId: "rx-old",
        startDate: "2026-01-01T00:00:00.000Z",
      }),
      makeMed({
        id: "new",
        prescriptionId: "rx-new",
        startDate: "2026-06-01T00:00:00.000Z",
      }),
    ]);

    expect(result.map((rx) => rx.id)).toEqual(["rx-new", "rx-old"]);
  });

  it("returns an empty array for no medicines", () => {
    expect(groupIntoPrescriptions([])).toEqual([]);
  });
});
