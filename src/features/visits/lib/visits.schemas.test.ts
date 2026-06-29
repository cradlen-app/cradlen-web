import { describe, expect, it } from "vitest";
import {
  bookVisitSchema,
  getDefaultBookVisitValues,
  makeBookVisitSchema,
  makeVisitIntakeSchema,
  parseVitalNumber,
  visitStatusSchema,
  visitTypeSchema,
  visitPrioritySchema,
  waitingListFilterSchema,
} from "./visits.schemas";

// Translator that echoes the key so we can assert on which error fired.
const t = (key: string) => key;

function validBookVisit(overrides: Record<string, unknown> = {}) {
  return {
    patientMode: "existing",
    patientId: "p-1",
    visitType: "VISIT",
    priority: "NORMAL",
    assignedDoctorId: "doc-1",
    ...overrides,
  };
}

describe("visits enum schemas", () => {
  it("accepts the canonical visit statuses and rejects unknown ones", () => {
    expect(visitStatusSchema.parse("IN_CONSULTATION")).toBe("IN_CONSULTATION");
    expect(visitStatusSchema.safeParse("DELETED").success).toBe(false);
  });

  it("constrains visit type / priority / waiting-list filter", () => {
    expect(visitTypeSchema.parse("MEDICAL_REP")).toBe("MEDICAL_REP");
    expect(visitTypeSchema.safeParse("WALK_IN").success).toBe(false);

    expect(visitPrioritySchema.parse("EMERGENCY")).toBe("EMERGENCY");
    expect(visitPrioritySchema.safeParse("LOW").success).toBe(false);

    expect(waitingListFilterSchema.parse("all")).toBe("all");
    expect(waitingListFilterSchema.parse("EMERGENCY")).toBe("EMERGENCY");
    expect(waitingListFilterSchema.safeParse("bogus").success).toBe(false);
  });
});

describe("parseVitalNumber", () => {
  it("returns undefined for empty / undefined / non-numeric input", () => {
    expect(parseVitalNumber(undefined)).toBeUndefined();
    expect(parseVitalNumber("")).toBeUndefined();
    expect(parseVitalNumber("abc")).toBeUndefined();
  });

  it("parses numeric strings including zero and decimals", () => {
    expect(parseVitalNumber("0")).toBe(0);
    expect(parseVitalNumber("98.6")).toBe(98.6);
    expect(parseVitalNumber("120")).toBe(120);
  });
});

describe("makeVisitIntakeSchema", () => {
  const schema = makeVisitIntakeSchema(t);

  it("accepts an empty object (all fields optional)", () => {
    expect(schema.safeParse({}).success).toBe(true);
  });

  it("accepts in-range vital strings and a known severity / category", () => {
    const result = schema.safeParse({
      chiefComplaint: "Headache",
      chiefComplaintCategories: ["PAIN"],
      chiefComplaintSeverity: "moderate",
      vitalsSystolicBp: "120",
      vitalsTemperatureC: "36.8",
      vitalsSpo2: "0",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an out-of-range vital and surfaces the translated key", () => {
    const result = schema.safeParse({ vitalsSystolicBp: "300" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "vitalsSystolicBp");
      expect(issue?.message).toBe("create.errors.invalidVital");
    }
  });

  it("rejects a non-numeric vital", () => {
    expect(schema.safeParse({ vitalsPulse: "fast" }).success).toBe(false);
  });

  it("rejects unknown chief-complaint categories and severity", () => {
    expect(schema.safeParse({ chiefComplaintCategories: ["NOPE"] }).success).toBe(false);
    expect(schema.safeParse({ chiefComplaintSeverity: "extreme" }).success).toBe(false);
  });
});

describe("makeBookVisitSchema — existing patient", () => {
  const schema = makeBookVisitSchema(t);

  it("parses a valid existing-patient booking", () => {
    expect(schema.safeParse(validBookVisit()).success).toBe(true);
  });

  it("requires a patientId in existing mode", () => {
    const result = schema.safeParse(validBookVisit({ patientId: "" }));
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "patientId");
      expect(issue?.message).toBe("create.errors.patientRequired");
    }
  });

  it("requires a non-empty assignedDoctorId", () => {
    const result = schema.safeParse(validBookVisit({ assignedDoctorId: "" }));
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "assignedDoctorId");
      expect(issue?.message).toBe("create.errors.doctorRequired");
    }
  });
});

describe("makeBookVisitSchema — new patient", () => {
  const schema = makeBookVisitSchema(t);

  function newPatient(overrides: Record<string, unknown> = {}) {
    return {
      patientMode: "new",
      fullName: "Sara Mahmoud",
      phoneNumber: "01012345678",
      nationalId: "29403121234567",
      dateOfBirth: "1994-03-12",
      visitType: "VISIT",
      priority: "NORMAL",
      assignedDoctorId: "doc-1",
      ...overrides,
    };
  }

  it("parses a fully populated new-patient booking", () => {
    expect(schema.safeParse(newPatient()).success).toBe(true);
  });

  it("requires fullName and phoneNumber", () => {
    const result = schema.safeParse(newPatient({ fullName: "", phoneNumber: "" }));
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0]);
      expect(paths).toContain("fullName");
      expect(paths).toContain("phoneNumber");
    }
  });

  it("requires nationalId and dateOfBirth for non medical-rep visits", () => {
    const result = schema.safeParse(
      newPatient({ nationalId: "", dateOfBirth: "" }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain("create.errors.nationalIdRequired");
      expect(messages).toContain("create.errors.dobRequired");
    }
  });

  it("does NOT require nationalId / dateOfBirth for medical-rep visits", () => {
    const result = schema.safeParse(
      newPatient({ visitType: "MEDICAL_REP", nationalId: "", dateOfBirth: "" }),
    );
    expect(result.success).toBe(true);
  });

  it("rejects an invalid Egyptian national id", () => {
    const result = schema.safeParse(newPatient({ nationalId: "12345678901234" }));
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "nationalId");
      expect(issue?.message).toBe("create.errors.invalidNationalId");
    }
  });

  it("rejects a national id with a bad governorate code", () => {
    // century 2 / 1994-03-12 valid date, but gov code "99" is not in the set.
    const result = schema.safeParse(newPatient({ nationalId: "29403129912345" }));
    expect(result.success).toBe(false);
  });

  it("rejects a national id with an impossible calendar date", () => {
    // month 13 → invalid date.
    const result = schema.safeParse(newPatient({ nationalId: "29413120112345" }));
    expect(result.success).toBe(false);
  });

  it("rejects an invalid phone number", () => {
    const result = schema.safeParse(newPatient({ phoneNumber: "12345" }));
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path[0] === "phoneNumber");
      expect(issue?.message).toBe("create.errors.invalidPhone");
    }
  });

  it("accepts an international E.164 phone number", () => {
    expect(schema.safeParse(newPatient({ phoneNumber: "+14155552671" })).success).toBe(
      true,
    );
  });

  it("accepts a phone number with spaces / dashes (normalized before validation)", () => {
    expect(
      schema.safeParse(newPatient({ phoneNumber: "010 1234-5678" })).success,
    ).toBe(true);
  });
});

describe("bookVisitSchema (default translator)", () => {
  it("is the identity-translator instance and validates", () => {
    expect(bookVisitSchema.safeParse(validBookVisit()).success).toBe(true);
  });
});

describe("getDefaultBookVisitValues", () => {
  it("returns the new-patient defaults with empty strings and undefined enums", () => {
    const defaults = getDefaultBookVisitValues();
    expect(defaults.patientMode).toBe("new");
    expect(defaults.visitType).toBe("VISIT");
    expect(defaults.priority).toBe("NORMAL");
    expect(defaults.assignedDoctorId).toBe("");
    expect(defaults.maritalStatus).toBeUndefined();
    expect(defaults.chiefComplaintSeverity).toBeUndefined();
    expect(defaults.chiefComplaintCategories).toEqual([]);
    expect(defaults.vitalsSystolicBp).toBe("");
  });

  it("seeds scheduledAt as a local datetime-local string (YYYY-MM-DDTHH:mm)", () => {
    const defaults = getDefaultBookVisitValues();
    expect(defaults.scheduledAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });
});
