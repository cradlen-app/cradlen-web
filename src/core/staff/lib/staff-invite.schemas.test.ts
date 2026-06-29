import { describe, expect, it } from "vitest";
import {
  getDefaultStaffCreateDirectValues,
  getDefaultStaffInviteValues,
  splitStaffName,
  STAFF_INVITE_DAYS,
  staffCreateDirectSchema,
  staffEditSchema,
  staffInviteSchema,
  type StaffInviteFormValues,
} from "./staff-invite.schemas";

function baseValues(
  overrides: Partial<StaffInviteFormValues> = {},
): StaffInviteFormValues {
  return {
    name: "Mona Said",
    roleId: "role-1",
    phone: "",
    jobRole: "NONE",
    doctorSpecialty: "",
    doctorSubspecialties: [],
    professionalTitle: "",
    executiveTitle: null,
    engagementType: "FULL_TIME",
    branchIds: ["b-1"],
    shifts: [],
    email: "mona@example.com",
    ...overrides,
  };
}

describe("staffInviteSchema", () => {
  it("accepts a valid invite", () => {
    expect(staffInviteSchema.safeParse(baseValues()).success).toBe(true);
  });

  it("requires a first and last name", () => {
    const res = staffInviteSchema.safeParse(baseValues({ name: "Mona" }));
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues.some((i) => i.message === "Enter first and last name")).toBe(
        true,
      );
    }
  });

  it("requires a role id", () => {
    expect(staffInviteSchema.safeParse(baseValues({ roleId: "" })).success).toBe(false);
  });

  it("requires at least one branch", () => {
    expect(staffInviteSchema.safeParse(baseValues({ branchIds: [] })).success).toBe(false);
  });

  it("requires a valid email", () => {
    expect(staffInviteSchema.safeParse(baseValues({ email: "nope" })).success).toBe(false);
    expect(staffInviteSchema.safeParse(baseValues({ email: "" })).success).toBe(false);
  });

  it("requires a specialty when the job role is DOCTOR", () => {
    const res = staffInviteSchema.safeParse(
      baseValues({ jobRole: "DOCTOR", doctorSpecialty: "" }),
    );
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues.some((i) => i.message === "Select a specialty")).toBe(true);
    }
  });

  it("allows a DOCTOR with a specialty", () => {
    expect(
      staffInviteSchema.safeParse(
        baseValues({ jobRole: "DOCTOR", doctorSpecialty: "CARD" }),
      ).success,
    ).toBe(true);
  });

  it("validates enabled shift times (end after start, both required)", () => {
    const bad = staffInviteSchema.safeParse(
      baseValues({
        shifts: [{ day: "MON", enabled: true, startTime: "17:00", endTime: "09:00" }],
      }),
    );
    expect(bad.success).toBe(false);
    if (!bad.success) {
      expect(bad.error.issues.some((i) => i.message === "End time must be later")).toBe(
        true,
      );
    }

    const missing = staffInviteSchema.safeParse(
      baseValues({
        shifts: [{ day: "MON", enabled: true, startTime: "", endTime: "" }],
      }),
    );
    expect(missing.success).toBe(false);
  });

  it("ignores time validation for disabled shifts", () => {
    expect(
      staffInviteSchema.safeParse(
        baseValues({
          shifts: [{ day: "MON", enabled: false, startTime: "", endTime: "" }],
        }),
      ).success,
    ).toBe(true);
  });
});

describe("staffEditSchema", () => {
  it("does not require a valid email format", () => {
    const res = staffEditSchema.safeParse({ ...baseValues(), email: "" });
    expect(res.success).toBe(true);
  });
});

describe("staffCreateDirectSchema", () => {
  it("requires phone and an 8+ char password", () => {
    const tooShort = staffCreateDirectSchema.safeParse({
      ...baseValues(),
      phone: "+2010",
      password: "short",
    });
    expect(tooShort.success).toBe(false);

    const ok = staffCreateDirectSchema.safeParse({
      ...baseValues(),
      phone: "+2010",
      password: "longenough",
    });
    expect(ok.success).toBe(true);
  });

  it("requires a non-empty phone", () => {
    const res = staffCreateDirectSchema.safeParse({
      ...baseValues(),
      phone: "",
      password: "longenough",
    });
    expect(res.success).toBe(false);
  });
});

describe("default value factories", () => {
  it("getDefaultStaffInviteValues seeds 7 disabled shifts and the given branches", () => {
    const v = getDefaultStaffInviteValues(["b-1", "b-2"]);
    expect(v.branchIds).toEqual(["b-1", "b-2"]);
    expect(v.shifts).toHaveLength(STAFF_INVITE_DAYS.length);
    expect(v.shifts.every((s) => s.enabled === false)).toBe(true);
    expect(v.shifts.map((s) => s.day)).toEqual([...STAFF_INVITE_DAYS]);
    expect(v.engagementType).toBe("FULL_TIME");
  });

  it("getDefaultStaffCreateDirectValues includes an empty password and phone", () => {
    const v = getDefaultStaffCreateDirectValues();
    expect(v.password).toBe("");
    expect(v.phone).toBe("");
    expect(v.branchIds).toEqual([]);
  });
});

describe("splitStaffName", () => {
  it("splits the first token from the rest", () => {
    expect(splitStaffName("Mona Said")).toEqual({ firstName: "Mona", lastName: "Said" });
  });

  it("joins multi-word last names", () => {
    expect(splitStaffName("Mona El Said")).toEqual({
      firstName: "Mona",
      lastName: "El Said",
    });
  });

  it("handles a single name and surrounding whitespace", () => {
    expect(splitStaffName("  Mona  ")).toEqual({ firstName: "Mona", lastName: "" });
    expect(splitStaffName("")).toEqual({ firstName: "", lastName: "" });
  });
});
