import { describe, expect, it } from "vitest";
import {
  dayOffEventSchema,
  genericEventSchema,
  meetingEventSchema,
  newEventSchema,
  procedureEventSchema,
} from "./calendar.schemas";

const UUID = "123e4567-e89b-12d3-a456-426614174000";
const UUID2 = "223e4567-e89b-12d3-a456-426614174000";

const validBase = {
  title: "My event",
  start_at: "2024-03-10T09:00:00Z",
  end_at: "2024-03-10T10:00:00Z",
};

describe("baseEventSchema (via genericEventSchema)", () => {
  it("accepts a minimal valid generic event", () => {
    const r = genericEventSchema.safeParse({
      ...validBase,
      event_type: "GENERIC",
    });
    expect(r.success).toBe(true);
  });

  it("rejects an empty title", () => {
    const r = genericEventSchema.safeParse({
      ...validBase,
      title: "",
      event_type: "GENERIC",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path.includes("title"))).toBe(true);
    }
  });

  it("rejects a title longer than 200 chars", () => {
    const r = genericEventSchema.safeParse({
      ...validBase,
      title: "a".repeat(201),
      event_type: "GENERIC",
    });
    expect(r.success).toBe(false);
  });

  it("rejects an empty start_at", () => {
    const r = genericEventSchema.safeParse({
      ...validBase,
      start_at: "",
      event_type: "GENERIC",
    });
    expect(r.success).toBe(false);
  });

  it("rejects when end is not after start", () => {
    const r = genericEventSchema.safeParse({
      ...validBase,
      start_at: "2024-03-10T10:00:00Z",
      end_at: "2024-03-10T09:00:00Z",
      event_type: "GENERIC",
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0].path).toEqual(["end_at"]);
      expect(r.error.issues[0].message).toBe("End must be after start");
    }
  });

  it("rejects when end equals start (must be strictly after)", () => {
    const r = genericEventSchema.safeParse({
      ...validBase,
      start_at: "2024-03-10T09:00:00Z",
      end_at: "2024-03-10T09:00:00Z",
      event_type: "GENERIC",
    });
    expect(r.success).toBe(false);
  });

  it("rejects unparseable dates", () => {
    const r = genericEventSchema.safeParse({
      title: "x",
      start_at: "not-a-date",
      end_at: "also-not",
      event_type: "GENERIC",
    });
    expect(r.success).toBe(false);
  });

  it("allows an empty-string branch_id (literal) as well as a uuid", () => {
    expect(
      genericEventSchema.safeParse({
        ...validBase,
        branch_id: "",
        event_type: "GENERIC",
      }).success,
    ).toBe(true);
    expect(
      genericEventSchema.safeParse({
        ...validBase,
        branch_id: UUID,
        event_type: "GENERIC",
      }).success,
    ).toBe(true);
  });

  it("rejects a non-uuid, non-empty branch_id", () => {
    const r = genericEventSchema.safeParse({
      ...validBase,
      branch_id: "nope",
      event_type: "GENERIC",
    });
    expect(r.success).toBe(false);
  });

  it("rejects an invalid visibility enum value", () => {
    const r = genericEventSchema.safeParse({
      ...validBase,
      visibility: "PUBLIC",
      event_type: "GENERIC",
    });
    expect(r.success).toBe(false);
  });
});

describe("dayOffEventSchema", () => {
  it("requires the DAY_OFF discriminator literal", () => {
    expect(
      dayOffEventSchema.safeParse({ ...validBase, event_type: "DAY_OFF" })
        .success,
    ).toBe(true);
    expect(
      dayOffEventSchema.safeParse({ ...validBase, event_type: "MEETING" })
        .success,
    ).toBe(false);
  });
});

describe("meetingEventSchema", () => {
  it("requires the MEETING discriminator literal", () => {
    expect(
      meetingEventSchema.safeParse({ ...validBase, event_type: "MEETING" })
        .success,
    ).toBe(true);
  });
});

describe("procedureEventSchema", () => {
  it("requires a valid procedure_id uuid", () => {
    expect(
      procedureEventSchema.safeParse({
        ...validBase,
        event_type: "PROCEDURE",
        procedure_id: UUID,
      }).success,
    ).toBe(true);

    const missing = procedureEventSchema.safeParse({
      ...validBase,
      event_type: "PROCEDURE",
    });
    expect(missing.success).toBe(false);

    const bad = procedureEventSchema.safeParse({
      ...validBase,
      event_type: "PROCEDURE",
      procedure_id: "not-a-uuid",
    });
    expect(bad.success).toBe(false);
  });

  it("accepts optional patient_id and assistant_profile_ids arrays", () => {
    const r = procedureEventSchema.safeParse({
      ...validBase,
      event_type: "PROCEDURE",
      procedure_id: UUID,
      patient_id: UUID2,
      assistant_profile_ids: [UUID, UUID2],
    });
    expect(r.success).toBe(true);
  });

  it("allows an empty-string patient_id", () => {
    const r = procedureEventSchema.safeParse({
      ...validBase,
      event_type: "PROCEDURE",
      procedure_id: UUID,
      patient_id: "",
    });
    expect(r.success).toBe(true);
  });

  it("rejects more than 20 assistants", () => {
    const r = procedureEventSchema.safeParse({
      ...validBase,
      event_type: "PROCEDURE",
      procedure_id: UUID,
      assistant_profile_ids: new Array(21).fill(UUID),
    });
    expect(r.success).toBe(false);
  });

  it("rejects a non-uuid assistant id", () => {
    const r = procedureEventSchema.safeParse({
      ...validBase,
      event_type: "PROCEDURE",
      procedure_id: UUID,
      assistant_profile_ids: ["bad"],
    });
    expect(r.success).toBe(false);
  });
});

describe("newEventSchema (discriminated union)", () => {
  it("parses each event_type into its matching branch", () => {
    expect(
      newEventSchema.safeParse({ ...validBase, event_type: "GENERIC" }).success,
    ).toBe(true);
    expect(
      newEventSchema.safeParse({ ...validBase, event_type: "MEETING" }).success,
    ).toBe(true);
    expect(
      newEventSchema.safeParse({ ...validBase, event_type: "DAY_OFF" }).success,
    ).toBe(true);
    expect(
      newEventSchema.safeParse({
        ...validBase,
        event_type: "PROCEDURE",
        procedure_id: UUID,
      }).success,
    ).toBe(true);
  });

  it("rejects an unknown event_type", () => {
    const r = newEventSchema.safeParse({ ...validBase, event_type: "PARTY" });
    expect(r.success).toBe(false);
  });

  it("rejects a PROCEDURE without its required procedure_id", () => {
    const r = newEventSchema.safeParse({
      ...validBase,
      event_type: "PROCEDURE",
    });
    expect(r.success).toBe(false);
  });
});
