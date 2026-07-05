import { describe, expect, it } from "vitest";
import type {
  ApiPatient,
  ApiPatientListItem,
  ApiVisit,
  ApiVisitStats,
  ApiScheduleEvent,
} from "../types/visits.api.types";
import {
  buildWaitingListQuery,
  formatClockTime,
  formatTimeRange,
  formatWaitTime,
  getTodayIso,
  mapApiMedRepVisitToVisit,
  mapApiPatientListItemToPatient,
  mapApiPatientToPatient,
  mapApiScheduleEvent,
  mapApiStatsToStats,
  mapApiVisitToScheduleEvent,
  mapApiVisitToVisit,
  pruneEmpty,
  visitWorkspacePath,
} from "./visits.utils";

describe("mapApiVisitToVisit", () => {
  const apiVisit: ApiVisit = {
    id: "v-1",
    appointment_type: "FOLLOW_UP",
    priority: "EMERGENCY",
    status: "CHECKED_IN",
    scheduled_at: "2026-06-28T09:00:00Z",
    queue_number: 4,
    branch_id: "br-1",
    specialty_code: "OBGYN",
    notes: "bring labs",
    chief_complaint: "cramping",
    chief_complaint_meta: { categories: ["PAIN"] },
    vitals: { systolic_bp: 120, diastolic_bp: 80 },
    created_at: "2026-06-28T08:00:00Z",
    started_at: "2026-06-28T09:05:00Z",
    completed_at: undefined,
    assigned_doctor: {
      id: "doc-1",
      user: { id: "u-1", first_name: "Hala", last_name: "Younis" },
    },
    episode: {
      id: "ep-1",
      journey: {
        patient: { id: "p-1", full_name: "Sara Mahmoud" },
        care_path: { code: "ANC" },
      },
    },
  };

  it("maps the nested API shape into the flat Visit", () => {
    const visit = mapApiVisitToVisit(apiVisit);
    expect(visit).toMatchObject({
      id: "v-1",
      kind: "patient",
      branchId: "br-1",
      queueNumber: 4,
      type: "FOLLOW_UP",
      status: "CHECKED_IN",
      priority: "EMERGENCY",
      episodeId: "ep-1",
      assignedDoctorId: "doc-1",
      assignedDoctorName: "Hala Younis",
      carePathCode: "ANC",
      specialtyCode: "OBGYN",
      chiefComplaint: "cramping",
    });
    expect(visit.patient).toMatchObject({ id: "p-1", fullName: "Sara Mahmoud" });
  });

  it("falls back to safe defaults when nested data is missing", () => {
    const visit = mapApiVisitToVisit({
      id: "v-2",
      appointment_type: "VISIT",
      priority: "NORMAL",
      status: "SCHEDULED",
    } as ApiVisit);
    expect(visit.branchId).toBe("");
    expect(visit.patient.fullName).toBe("");
    expect(visit.assignedDoctorName).toBeUndefined();
    expect(visit.carePathCode).toBeUndefined();
    expect(visit.specialtyCode).toBeNull();
    expect(visit.chiefComplaint).toBeNull();
    expect(visit.createdAt).toBe("");
  });
});

describe("mapApiMedRepVisitToVisit", () => {
  it("composes a display name with company and maps rep + doctor", () => {
    const visit = mapApiMedRepVisitToVisit({
      id: "mrv-1",
      branch_id: "br-1",
      medical_rep_id: "rep-1",
      assigned_doctor_id: "doc-1",
      scheduled_at: "2026-06-28T10:00:00Z",
      status: "CHECKED_IN",
      priority: "NORMAL",
      queue_number: 2,
      medical_rep: {
        id: "rep-1",
        organization_id: "org-1",
        full_name: "Omar Said",
        national_id: "123",
        phone_number: "+201000000000",
        email: "omar@pharma.test",
        company_name: "PharmaCo",
        specialty_focus: "OBGYN",
        notes: null,
        created_at: "2026-01-01T00:00:00Z",
      },
      assigned_doctor: {
        id: "doc-1",
        user: { id: "u-1", first_name: "Hala", last_name: "Younis" },
      },
    });

    expect(visit.kind).toBe("medical_rep");
    expect(visit.type).toBe("MEDICAL_REP");
    expect(visit.patient.fullName).toBe("Omar Said");
    expect(visit.patient.companyName).toBe("PharmaCo");
    expect(visit.patient.specialtyFocus).toBe("OBGYN");
    expect(visit.assignedDoctorName).toBe("Hala Younis");
    expect(visit.chiefComplaint).toBeNull();
  });

  it("falls back to 'Medical rep' label and rep id when rep is absent", () => {
    const visit = mapApiMedRepVisitToVisit({
      id: "mrv-2",
      branch_id: "br-1",
      medical_rep_id: "rep-9",
      assigned_doctor_id: "doc-2",
      scheduled_at: "2026-06-28T10:00:00Z",
      status: "SCHEDULED",
      priority: "NORMAL",
    });
    expect(visit.patient.id).toBe("rep-9");
    expect(visit.patient.fullName).toBe("Medical rep");
    expect(visit.assignedDoctorId).toBe("doc-2");
    expect(visit.assignedDoctorName).toBeUndefined();
  });

  it("uses the rep full name (no company) when company_name is empty", () => {
    const visit = mapApiMedRepVisitToVisit({
      id: "mrv-3",
      branch_id: "br-1",
      medical_rep_id: "rep-3",
      assigned_doctor_id: "doc-3",
      scheduled_at: "2026-06-28T10:00:00Z",
      status: "SCHEDULED",
      priority: "NORMAL",
      medical_rep: {
        id: "rep-3",
        organization_id: "org-1",
        full_name: "Lina Adel",
        national_id: null,
        phone_number: null,
        email: null,
        company_name: "",
        specialty_focus: null,
        notes: null,
        created_at: "2026-01-01T00:00:00Z",
      },
    });
    expect(visit.patient.fullName).toBe("Lina Adel");
  });
});

describe("pruneEmpty", () => {
  it("strips undefined, null, empty strings and NaN", () => {
    expect(
      pruneEmpty({ a: 1, b: undefined, c: null, d: "  ", e: Number.NaN, f: "ok" }),
    ).toEqual({ a: 1, f: "ok" });
  });

  it("keeps zero and false (they are not empty)", () => {
    expect(pruneEmpty({ a: 0, b: false })).toEqual({ a: 0, b: false });
  });

  it("drops empty arrays but keeps non-empty ones", () => {
    expect(pruneEmpty({ a: [], b: [1] })).toEqual({ b: [1] });
  });

  it("recurses into nested objects and drops empty nested results", () => {
    expect(
      pruneEmpty({ outer: { inner: "", keep: "x" }, gone: { a: "" } }),
    ).toEqual({ outer: { keep: "x" } });
  });

  it("returns undefined when everything is pruned", () => {
    expect(pruneEmpty({ a: "", b: undefined })).toBeUndefined();
  });
});

describe("mapApiPatientToPatient", () => {
  it("maps fields and truncates ISO dates to YYYY-MM-DD", () => {
    const api: ApiPatient = {
      id: "p-1",
      full_name: "Sara Mahmoud",
      national_id: "29403121234567",
      date_of_birth: "1994-03-12T00:00:00Z",
      phone_number: "+201000000000",
      address: "Cairo",
      marital_status: "MARRIED",
      last_visit_date: "2026-06-01T10:00:00Z",
      next_visit_date: "2026-07-01T10:00:00Z",
      active_journey_name: "Pregnancy",
      journey_status: "ACTIVE",
    };
    const patient = mapApiPatientToPatient(api);
    expect(patient.dateOfBirth).toBe("1994-03-12");
    expect(patient.lastVisitDate).toBe("2026-06-01");
    expect(patient.nextVisitDate).toBe("2026-07-01");
    expect(patient.maritalStatus).toBe("MARRIED");
  });

  it("leaves optional dates undefined when absent", () => {
    const patient = mapApiPatientToPatient({ id: "p-2", full_name: "X" } as ApiPatient);
    expect(patient.dateOfBirth).toBeUndefined();
    expect(patient.lastVisitDate).toBeUndefined();
  });
});

describe("mapApiPatientListItemToPatient", () => {
  it("maps list-item journey + image fields", () => {
    const api: ApiPatientListItem = {
      id: "p-1",
      full_name: "Sara",
      date_of_birth: "1994-03-12T00:00:00Z",
      last_visit_date: "2026-06-01T00:00:00Z",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-02T00:00:00Z",
      journey: { id: "j-1", type: "PREGNANCY", status: "ACTIVE" },
      profile_image_url: "https://img.test/a.png",
    };
    const patient = mapApiPatientListItemToPatient(api);
    expect(patient.journeyId).toBe("j-1");
    expect(patient.journeyType).toBe("PREGNANCY");
    expect(patient.lastVisitDate).toBe("2026-06-01");
    expect(patient.imageUrl).toBe("https://img.test/a.png");
  });

  it("handles null journey, null image and null last_visit_date", () => {
    const patient = mapApiPatientListItemToPatient({
      id: "p-2",
      full_name: "Y",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-02T00:00:00Z",
      journey: null,
      last_visit_date: null,
      profile_image_url: null,
    } as ApiPatientListItem);
    expect(patient.journeyId).toBeUndefined();
    expect(patient.lastVisitDate).toBeUndefined();
    expect(patient.imageUrl).toBeNull();
  });
});

describe("mapApiStatsToStats", () => {
  it("maps snake_case stats to camelCase", () => {
    const api: ApiVisitStats = {
      total_visits: 24,
      visits: 14,
      follow_ups: 7,
      medical_reps: 3,
    };
    expect(mapApiStatsToStats(api)).toEqual({
      totalVisits: 24,
      visits: 14,
      followUps: 7,
      medicalReps: 3,
    });
  });
});

describe("mapApiVisitToScheduleEvent", () => {
  it("derives a 30-minute window and resolves patient/doctor display", () => {
    const event = mapApiVisitToScheduleEvent({
      id: "v-1",
      appointment_type: "VISIT",
      priority: "NORMAL",
      status: "SCHEDULED",
      scheduled_at: "2026-06-28T09:00:00.000Z",
      branch_id: "br-1",
      assigned_doctor: {
        id: "doc-1",
        user: { id: "u-1", first_name: "Hala", last_name: "Younis" },
      },
      episode: {
        id: "ep-1",
        journey: { patient: { id: "p-1", full_name: "Sara Mahmoud" } },
      },
    } as ApiVisit);

    expect(event.kind).toBe("visit");
    expect(event.title).toBe("Sara Mahmoud");
    expect(event.patient_name).toBe("Sara Mahmoud");
    expect(event.doctor_ids).toEqual(["doc-1"]);
    expect(event.doctor_names).toEqual(["Hala Younis"]);
    expect(event.start_time).toBe("2026-06-28T09:00:00.000Z");
    expect(event.end_time).toBe("2026-06-28T09:30:00.000Z");
  });

  it("maps appointment_type to the schedule kind and titles by type when no patient", () => {
    const event = mapApiVisitToScheduleEvent({
      id: "v-2",
      appointment_type: "MEDICAL_REP",
      priority: "NORMAL",
      status: "SCHEDULED",
      scheduled_at: "2026-06-28T11:00:00.000Z",
    } as ApiVisit);
    expect(event.kind).toBe("meeting");
    expect(event.title).toBe("MEDICAL_REP");
    expect(event.doctor_ids).toBeUndefined();
    expect(event.branch_id).toBe("");
  });

  it("falls back to created_at when scheduled_at is absent", () => {
    const event = mapApiVisitToScheduleEvent({
      id: "v-3",
      appointment_type: "FOLLOW_UP",
      priority: "NORMAL",
      status: "SCHEDULED",
      created_at: "2026-06-28T12:00:00.000Z",
    } as ApiVisit);
    expect(event.kind).toBe("appointment");
    expect(event.start_time).toBe("2026-06-28T12:00:00.000Z");
    expect(event.end_time).toBe("2026-06-28T12:30:00.000Z");
  });
});

describe("mapApiScheduleEvent", () => {
  it("maps snake_case schedule event to camelCase", () => {
    const api: ApiScheduleEvent = {
      id: "sch-1",
      branch_id: "br-1",
      title: "Team huddle",
      kind: "meeting",
      patient_name: "Sara",
      doctor_ids: ["doc-1"],
      doctor_names: ["Hala"],
      start_time: "2026-06-28T11:00:00Z",
      end_time: "2026-06-28T11:30:00Z",
      notes: "weekly",
    };
    expect(mapApiScheduleEvent(api)).toEqual({
      id: "sch-1",
      branchId: "br-1",
      title: "Team huddle",
      kind: "meeting",
      patientName: "Sara",
      doctorIds: ["doc-1"],
      doctorNames: ["Hala"],
      startTime: "2026-06-28T11:00:00Z",
      endTime: "2026-06-28T11:30:00Z",
      notes: "weekly",
    });
  });
});

describe("buildWaitingListQuery", () => {
  it("maps each filter to its query shape", () => {
    expect(buildWaitingListQuery("VISIT")).toEqual({ type: "VISIT" });
    expect(buildWaitingListQuery("FOLLOW_UP")).toEqual({ type: "FOLLOW_UP" });
    expect(buildWaitingListQuery("MEDICAL_REP")).toEqual({ type: "MEDICAL_REP" });
    expect(buildWaitingListQuery("EMERGENCY")).toEqual({ priority: "EMERGENCY" });
  });

  it("returns an empty object for the 'all' filter", () => {
    expect(buildWaitingListQuery("all")).toEqual({});
  });
});

describe("formatClockTime / formatTimeRange", () => {
  it("returns an empty string for missing or invalid ISO", () => {
    expect(formatClockTime(undefined)).toBe("");
    expect(formatClockTime("not-a-date")).toBe("");
  });

  it("formats a valid ISO into a 12-hour clock label", () => {
    // 09:00 UTC — assert it contains a meridiem marker rather than a fixed
    // hour (the formatter renders in the runner's local timezone).
    expect(formatClockTime("2026-06-28T09:00:00Z")).toMatch(/\b(AM|PM)\b/);
  });

  it("joins two clock times with a dash", () => {
    const range = formatTimeRange("2026-06-28T09:00:00Z", "2026-06-28T09:30:00Z");
    expect(range).toMatch(/ - /);
  });
});

describe("formatWaitTime", () => {
  const base = new Date("2026-06-28T12:00:00Z");

  it("returns minutes under an hour", () => {
    expect(formatWaitTime("2026-06-28T11:45:00Z", base)).toBe("15m");
  });

  it("clamps negative (future) timestamps to 0m", () => {
    expect(formatWaitTime("2026-06-28T12:30:00Z", base)).toBe("0m");
  });

  it("formats whole hours without trailing minutes", () => {
    expect(formatWaitTime("2026-06-28T10:00:00Z", base)).toBe("2h");
  });

  it("formats hours and remaining minutes", () => {
    expect(formatWaitTime("2026-06-28T10:20:00Z", base)).toBe("1h 40m");
  });

  it("returns an empty string for an invalid timestamp", () => {
    expect(formatWaitTime("nope", base)).toBe("");
  });
});

describe("getTodayIso", () => {
  it("formats the given date as a zero-padded YYYY-MM-DD", () => {
    expect(getTodayIso(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(getTodayIso(new Date(2026, 11, 31))).toBe("2026-12-31");
  });
});

describe("visitWorkspacePath", () => {
  it("builds a patient visit workspace path", () => {
    expect(visitWorkspacePath({ id: "v-1", kind: "patient" }, "org-1", "br-1")).toBe(
      "/org-1/br-1/dashboard/visits/v-1",
    );
  });

  it("appends ?kind=medical_rep for rep visits", () => {
    expect(
      visitWorkspacePath({ id: "v-9", kind: "medical_rep" }, "org-1", "br-1"),
    ).toBe("/org-1/br-1/dashboard/visits/v-9?kind=medical_rep");
  });

  it("tolerates null org / branch ids in the segment", () => {
    expect(visitWorkspacePath({ id: "v-1", kind: "patient" }, null, null)).toBe(
      "/null/null/dashboard/visits/v-1",
    );
  });
});
