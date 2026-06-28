import { describe, expect, it } from "vitest";
import { queryKeys } from "./queryKeys";

describe("queryKeys — auth", () => {
  it("currentUser is a stable single-element key", () => {
    expect(queryKeys.currentUser()).toEqual(["currentUser"]);
  });

  it("registrationStatus embeds the email", () => {
    expect(queryKeys.registrationStatus("a@b.com")).toEqual([
      "registration-status",
      "a@b.com",
    ]);
  });
});

describe("queryKeys — visits", () => {
  it("broad/branch keys are hierarchical prefixes", () => {
    expect(queryKeys.visits.all()).toEqual(["visits"]);
    expect(queryKeys.visits.branch("b1")).toEqual(["visits", "b1"]);
    // branch key extends the broad key (prefix-match invalidation works).
    expect(queryKeys.visits.branch("b1").slice(0, 1)).toEqual(
      queryKeys.visits.all(),
    );
  });

  it("schedule and stats keys include the date + assignedToMe flag", () => {
    expect(queryKeys.visits.schedule("b1", "2024-03-10", true)).toEqual([
      "visits",
      "b1",
      "schedule",
      "2024-03-10",
      true,
    ]);
    expect(queryKeys.visits.stats("b1", "2024-03-10", false)).toEqual([
      "visits",
      "b1",
      "stats",
      "2024-03-10",
      false,
    ]);
  });

  it("monthlyStats defaults mine to false", () => {
    expect(queryKeys.visits.monthlyStats("org")).toEqual([
      "visits",
      "org",
      "monthly-stats",
      false,
    ]);
    expect(queryKeys.visits.monthlyStats("b1", true)).toEqual([
      "visits",
      "b1",
      "monthly-stats",
      true,
    ]);
  });

  it("paginated list keys carry the opts object", () => {
    const opts = { page: 2, limit: 20 };
    expect(queryKeys.visits.branchWaitingList("b1", opts)).toEqual([
      "visits",
      "b1",
      "waiting-list",
      opts,
    ]);
    expect(queryKeys.visits.myWaitingList("b1", opts)).toEqual([
      "visits",
      "b1",
      "my-waiting-list",
      opts,
    ]);
  });

  it("branchInProgress is namespaced under a v2 segment", () => {
    expect(queryKeys.visits.branchInProgress("b1")).toEqual([
      "visits",
      "v2",
      "b1",
      "in-progress",
    ]);
  });

  it("detail/print/history keys are distinct shapes", () => {
    expect(queryKeys.visits.byId("v1")).toEqual(["visits", "detail", "v1"]);
    expect(queryKeys.visits.prescriptionPrint("v1")).toEqual([
      "visits",
      "prescription-print",
      "v1",
    ]);
    expect(queryKeys.visits.patientHistory("p1", "v1")).toEqual([
      "visits",
      "patient-history",
      "p1",
      "v1",
    ]);
  });
});

describe("queryKeys — medicalRepVisits", () => {
  it("uses a separate root from patient visits", () => {
    expect(queryKeys.medicalRepVisits.all()).toEqual(["medical-rep-visits"]);
    expect(queryKeys.medicalRepVisits.all()[0]).not.toBe(
      queryKeys.visits.all()[0],
    );
  });

  it("byId mirrors the visits detail shape but on its own root", () => {
    expect(queryKeys.medicalRepVisits.byId("m1")).toEqual([
      "medical-rep-visits",
      "detail",
      "m1",
    ]);
  });
});

describe("queryKeys — patients / notifications / calendar", () => {
  it("patients.list normalizes mine to false when omitted", () => {
    expect(
      queryKeys.patients.list("b1", { search: "ann", journeyStatus: "ACTIVE" }),
    ).toEqual(["patients", "b1", "ann", "ACTIVE", false]);
  });

  it("patients.stats defaults mine to false", () => {
    expect(queryKeys.patients.stats("org")).toEqual([
      "patients",
      "org",
      "stats",
      false,
    ]);
  });

  it("notifications.list carries the pagination opts object", () => {
    const opts = { page: 1, limit: 10, category: "system" };
    expect(queryKeys.notifications.list(opts)).toEqual(["notifications", opts]);
    expect(queryKeys.notifications.all()).toEqual(["notifications"]);
  });

  it("calendar.events normalizes an undefined profileId to null", () => {
    expect(
      queryKeys.calendar.events("b1", "2024-03-01", "2024-03-31"),
    ).toEqual(["calendar", "events", "b1", "2024-03-01", "2024-03-31", null]);
    expect(
      queryKeys.calendar.events(undefined, "f", "t", "prof-1"),
    ).toEqual(["calendar", "events", undefined, "f", "t", "prof-1"]);
  });
});

describe("queryKeys — subscription / formTemplates", () => {
  it("subscription.payments defaults opts to an empty object", () => {
    expect(queryKeys.subscription.payments("org")).toEqual([
      "subscription",
      "org",
      "payments",
      {},
    ]);
    expect(queryKeys.subscription.payments("org", { status: "PENDING" })).toEqual([
      "subscription",
      "org",
      "payments",
      { status: "PENDING" },
    ]);
  });

  it("formTemplates.byCode normalizes optional extension/locale to null", () => {
    expect(queryKeys.formTemplates.byCode("CODE")).toEqual([
      "form-templates",
      "CODE",
      null,
      null,
    ]);
    expect(queryKeys.formTemplates.byCode("CODE", "ext", "en")).toEqual([
      "form-templates",
      "CODE",
      "ext",
      "en",
    ]);
  });
});

describe("queryKeys — uniqueness across namespaces", () => {
  it("every zero-arg root key is distinct", () => {
    const roots = [
      queryKeys.currentUser(),
      queryKeys.visits.all(),
      queryKeys.medicalRepVisits.all(),
      queryKeys.notifications.all(),
      queryKeys.investigations.all(),
      queryKeys.calendar.all(),
      queryKeys.lookups.specialties(),
      queryKeys.lookups.jobFunctions(),
      queryKeys.lookups.profile(),
      queryKeys.subscription.plans(),
    ].map((k) => JSON.stringify(k));
    expect(new Set(roots).size).toBe(roots.length);
  });

  it("differing arguments produce differing keys (cache separation)", () => {
    expect(queryKeys.patients.byId("a")).not.toEqual(
      queryKeys.patients.byId("b"),
    );
    expect(
      queryKeys.visits.schedule("b1", "2024-03-10", true),
    ).not.toEqual(queryKeys.visits.schedule("b1", "2024-03-10", false));
  });
});
