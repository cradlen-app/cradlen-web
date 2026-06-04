import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";

import type { ApiPatientMedicationItem } from "../data/patient-medications.api.types";
import { mapApiMedication } from "./map-medication";

function makeItem(
  overrides: Partial<ApiPatientMedicationItem> = {},
): ApiPatientMedicationItem {
  return {
    id: "item-1",
    name: "Folic acid",
    generic_name: "folic acid",
    strength: "5 mg",
    form: "tablet",
    category: "Supplement",
    dose: "1 tab",
    frequency: "every 24h",
    duration: "1 month",
    instructions: "after meals",
    route: "oral",
    visit_date: "2026-05-20T09:00:00.000Z",
    prescribed_at: "2026-05-20T09:00:00.000Z",
    end_date: null,
    is_current: true,
    doctor_name: "Dr. Sara Mansour",
    clinic_name: "Cradlen Maadi",
    ...overrides,
  };
}

describe("mapApiMedication", () => {
  it("passes through the core fields and maps doctor/clinic/visit-date", () => {
    const med = mapApiMedication(makeItem(), "active");

    expect(med).toMatchObject({
      id: "item-1",
      name: "Folic acid",
      genericName: "folic acid",
      dose: "1 tab",
      frequency: "every 24h",
      prescriberName: "Dr. Sara Mansour",
      startDate: "2026-05-20T09:00:00.000Z",
      status: "active",
    });
    expect(med.clinic).toEqual({ id: "Cradlen Maadi", name: "Cradlen Maadi" });
  });

  it("takes status from the bucket, not the item flag", () => {
    expect(mapApiMedication(makeItem({ is_current: true }), "past").status).toBe(
      "past",
    );
    expect(
      mapApiMedication(makeItem({ is_current: false }), "active").status,
    ).toBe("active");
  });

  it("maps a known dosage form and falls back to 'other' for unknown/empty", () => {
    expect(mapApiMedication(makeItem({ form: "Tablet" }), "active").form).toBe(
      "tablet",
    );
    expect(mapApiMedication(makeItem({ form: "ointment" }), "active").form).toBe(
      "other",
    );
    expect(
      mapApiMedication(makeItem({ form: null }), "active").form,
    ).toBeUndefined();
  });

  it("maps a known therapeutic class and omits an unknown one", () => {
    expect(
      mapApiMedication(makeItem({ category: "Supplement" }), "active").drugClass,
    ).toBe("supplement");
    expect(
      mapApiMedication(makeItem({ category: "Hormone" }), "active").drugClass,
    ).toBeUndefined();
    expect(
      mapApiMedication(makeItem({ category: null }), "active").drugClass,
    ).toBeUndefined();
  });

  it("leaves the structured dosage fields undefined (card falls back to dose · frequency)", () => {
    const med = mapApiMedication(makeItem(), "active");
    expect(med.amountPerDose).toBeUndefined();
    expect(med.intervalHours).toBeUndefined();
    expect(med.foodTiming).toBeUndefined();
    expect(med.courseDays).toBeUndefined();
  });

  describe("daysLeft", () => {
    // Local noon so `todayStart` (local midnight) is unambiguous; end dates use
    // local midnight too, so the day count is exact regardless of timezone.
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 5, 4, 12, 0, 0));
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it("counts whole days from the start of today to a future end", () => {
      const end = new Date(2026, 5, 14, 0, 0, 0).toISOString(); // +10 days
      expect(
        mapApiMedication(makeItem({ end_date: end }), "active").daysLeft,
      ).toBe(10);
    });

    it("is undefined when there is no end date", () => {
      expect(
        mapApiMedication(makeItem({ end_date: null }), "active").daysLeft,
      ).toBeUndefined();
    });

    it("is undefined for past meds even with an end date", () => {
      const end = new Date(2026, 4, 25, 0, 0, 0).toISOString(); // -10 days
      expect(
        mapApiMedication(makeItem({ end_date: end }), "past").daysLeft,
      ).toBeUndefined();
    });
  });
});
