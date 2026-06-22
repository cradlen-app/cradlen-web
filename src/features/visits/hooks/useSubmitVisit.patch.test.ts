import { describe, expect, it } from "vitest";
import { buildPatientPatch } from "./useSubmitVisit";
import type { ApiPatient } from "../types/visits.api.types";

const base: ApiPatient = {
  id: "p1",
  full_name: "Alice Smith",
  national_id: "12345678",
  date_of_birth: "1990-01-15",
  phone_number: "+201111111111",
  address: "123 Main St",
  marital_status: "SINGLE",
} as ApiPatient;

describe("buildPatientPatch", () => {
  it("includes only the changed demographics", () => {
    const patch = buildPatientPatch(base, {
      full_name: "Alice Smith",
      phone_number: "+202222222222", // changed
      date_of_birth: "1990-01-15",
      address: "123 Main St",
      marital_status: "MARRIED", // changed
    });
    expect(patch).toEqual({
      phone_number: "+202222222222",
      marital_status: "MARRIED",
    });
  });

  it("never patches national_id even when the form value differs", () => {
    const patch = buildPatientPatch(base, {
      national_id: "99999999", // attempted edit of an immutable field
      phone_number: "+203333333333",
    });
    expect(patch).not.toHaveProperty("national_id");
    expect(patch).toEqual({ phone_number: "+203333333333" });
  });

  it("ignores blank form values so they never clear the record", () => {
    const patch = buildPatientPatch(base, {
      phone_number: "   ",
      address: "",
    });
    expect(patch).toEqual({});
  });

  it("compares dates on the calendar day, ignoring a time component", () => {
    const patch = buildPatientPatch(
      { ...base, date_of_birth: "1990-01-15T00:00:00.000Z" } as ApiPatient,
      { date_of_birth: "1990-01-15" },
    );
    expect(patch).toEqual({});
  });
});
