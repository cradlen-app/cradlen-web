import { afterEach, describe, expect, it, vi } from "vitest";
import type { ApiCalendarEvent } from "../types/calendar.api.types";
import type { CalendarEvent } from "../types/calendar.types";
import {
  buildMonthGrid,
  formatEventTime,
  groupEventsByDate,
  localIsoDate,
  mapApiCalendarEvent,
  monthWindowFrom,
  todayIso,
} from "./calendar.utils";

afterEach(() => {
  vi.useRealTimers();
});

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: "e1",
    profileId: "p1",
    organizationId: "o1",
    branchId: "b1",
    type: "GENERIC",
    visibility: "PRIVATE",
    title: "Event",
    description: null,
    startsAt: "2024-03-10T09:00:00",
    endsAt: "2024-03-10T10:00:00",
    allDay: false,
    procedureId: null,
    procedureName: null,
    patientId: null,
    patientName: null,
    createdByName: null,
    assistants: [],
    createdAt: "2024-03-01T00:00:00Z",
    updatedAt: "2024-03-01T00:00:00Z",
    ...overrides,
  };
}

describe("buildMonthGrid", () => {
  it("returns a grid whose length is a multiple of 7", () => {
    for (let month = 0; month < 12; month++) {
      const cells = buildMonthGrid(2024, month, 0);
      expect(cells.length % 7).toBe(0);
    }
  });

  it("includes exactly the in-month days and marks them inMonth", () => {
    // March 2024 has 31 days.
    const cells = buildMonthGrid(2024, 2, 0);
    const inMonth = cells.filter((c) => c.inMonth);
    expect(inMonth).toHaveLength(31);
    expect(inMonth[0].day).toBe(1);
    expect(inMonth[0].iso).toBe("2024-03-01");
    expect(inMonth[30].day).toBe(31);
    expect(inMonth[30].iso).toBe("2024-03-31");
  });

  it("pads leading days from the previous month (Sunday start)", () => {
    // Jan 1 2024 is a Monday (getDay === 1). Sunday-start => 1 leading day.
    const cells = buildMonthGrid(2024, 0, 0);
    const leading = cells.filter((c, i) => !c.inMonth && i < 7);
    expect(leading[0].iso).toBe("2023-12-31");
    expect(leading[0].inMonth).toBe(false);
    // First in-month cell is Jan 1 at index 1.
    expect(cells[1]).toEqual({ day: 1, iso: "2024-01-01", inMonth: true });
  });

  it("pads leading days differently for a Saturday start", () => {
    // Jan 1 2024 is Monday => Saturday-start offset = (1-6+7)%7 = 2 leading days.
    const cells = buildMonthGrid(2024, 0, 6);
    expect(cells[0].iso).toBe("2023-12-30");
    expect(cells[1].iso).toBe("2023-12-31");
    expect(cells[2]).toEqual({ day: 1, iso: "2024-01-01", inMonth: true });
  });

  it("fills trailing cells from the next month so the last row is complete", () => {
    const cells = buildMonthGrid(2024, 0, 0);
    const last = cells[cells.length - 1];
    expect(last.inMonth).toBe(false);
    // Trailing days continue into February.
    expect(last.iso.startsWith("2024-02")).toBe(true);
  });

  it("handles a leap-year February (29 days)", () => {
    const cells = buildMonthGrid(2024, 1, 0);
    expect(cells.filter((c) => c.inMonth)).toHaveLength(29);
  });

  it("handles a non-leap-year February (28 days)", () => {
    const cells = buildMonthGrid(2023, 1, 0);
    expect(cells.filter((c) => c.inMonth)).toHaveLength(28);
  });

  it("produces unique, chronologically ordered iso dates", () => {
    const cells = buildMonthGrid(2024, 5, 0);
    const isos = cells.map((c) => c.iso);
    expect(new Set(isos).size).toBe(isos.length);
    const sorted = [...isos].sort();
    expect(isos).toEqual(sorted);
  });
});

describe("todayIso / localIsoDate", () => {
  it("todayIso returns the current local date as YYYY-MM-DD", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 5, 15, 12, 0, 0));
    expect(todayIso()).toBe("2024-06-15");
  });

  it("zero-pads single-digit months and days", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 0, 5, 8, 0, 0));
    expect(todayIso()).toBe("2024-01-05");
  });

  it("localIsoDate converts a local-time ISO into a date string", () => {
    // No trailing Z => parsed as local time, so date is timezone-stable.
    expect(localIsoDate("2024-07-04T13:45:00")).toBe("2024-07-04");
  });
});

describe("monthWindowFrom", () => {
  it("spans the first instant of the month to the last instant of the last day", () => {
    const { from, to } = monthWindowFrom(2024, 2); // March
    const fromD = new Date(from);
    const toD = new Date(to);

    expect(fromD.getFullYear()).toBe(2024);
    expect(fromD.getMonth()).toBe(2);
    expect(fromD.getDate()).toBe(1);
    expect(fromD.getHours()).toBe(0);
    expect(fromD.getMinutes()).toBe(0);

    expect(toD.getMonth()).toBe(2);
    expect(toD.getDate()).toBe(31); // last day of March
    expect(toD.getHours()).toBe(23);
    expect(toD.getMinutes()).toBe(59);
    expect(toD.getSeconds()).toBe(59);
    expect(toD.getMilliseconds()).toBe(999);
  });

  it("rolls a December window into the correct year boundary", () => {
    const { to } = monthWindowFrom(2024, 11); // December
    const toD = new Date(to);
    expect(toD.getMonth()).toBe(11);
    expect(toD.getDate()).toBe(31);
  });
});

describe("groupEventsByDate", () => {
  it("returns an empty map for no events", () => {
    expect(groupEventsByDate([])).toEqual({});
  });

  it("groups a single-day event under one key", () => {
    const ev = makeEvent({
      startsAt: "2024-03-10T09:00:00",
      endsAt: "2024-03-10T10:30:00",
    });
    const map = groupEventsByDate([ev]);
    expect(Object.keys(map)).toEqual(["2024-03-10"]);
    expect(map["2024-03-10"]).toEqual([ev]);
  });

  it("spreads a multi-day event across every spanned day inclusive", () => {
    const ev = makeEvent({
      startsAt: "2024-03-10T09:00:00",
      endsAt: "2024-03-12T08:00:00",
    });
    const map = groupEventsByDate([ev]);
    expect(Object.keys(map).sort()).toEqual([
      "2024-03-10",
      "2024-03-11",
      "2024-03-12",
    ]);
    for (const key of Object.keys(map)) {
      expect(map[key]).toEqual([ev]);
    }
  });

  it("accumulates multiple events that share a day", () => {
    const a = makeEvent({ id: "a" });
    const b = makeEvent({ id: "b" });
    const map = groupEventsByDate([a, b]);
    expect(map["2024-03-10"].map((e) => e.id)).toEqual(["a", "b"]);
  });
});

describe("formatEventTime", () => {
  it("joins start and end with an en-dash separator", () => {
    const out = formatEventTime("2024-01-01T09:30:00", "2024-01-01T10:45:00");
    const parts = out.split(" – ");
    expect(parts).toHaveLength(2);
    expect(parts[0].length).toBeGreaterThan(0);
    expect(parts[1].length).toBeGreaterThan(0);
  });
});

describe("mapApiCalendarEvent", () => {
  function apiEvent(overrides: Partial<ApiCalendarEvent> = {}): ApiCalendarEvent {
    return {
      id: "id-1",
      profile_id: "prof-1",
      organization_id: "org-1",
      branch_id: "branch-1",
      event_type: "PROCEDURE",
      visibility: "ORGANIZATION",
      title: "Surgery",
      description: "desc",
      start_at: "2024-03-10T09:00:00Z",
      end_at: "2024-03-10T10:00:00Z",
      all_day: false,
      procedure_id: "proc-1",
      patient_id: "pat-1",
      procedure_name: "Appendectomy",
      patient_full_name: "Jane Doe",
      created_by_name: "Dr. Smith",
      assistants: [{ profile_id: "as-1", full_name: "Nurse A" }],
      created_at: "2024-03-01T00:00:00Z",
      updated_at: "2024-03-02T00:00:00Z",
      ...overrides,
    };
  }

  it("maps every snake_case field to its camelCase counterpart", () => {
    const result = mapApiCalendarEvent(apiEvent());
    expect(result).toEqual({
      id: "id-1",
      profileId: "prof-1",
      organizationId: "org-1",
      branchId: "branch-1",
      type: "PROCEDURE",
      visibility: "ORGANIZATION",
      title: "Surgery",
      description: "desc",
      startsAt: "2024-03-10T09:00:00Z",
      endsAt: "2024-03-10T10:00:00Z",
      allDay: false,
      procedureId: "proc-1",
      procedureName: "Appendectomy",
      patientId: "pat-1",
      patientName: "Jane Doe",
      createdByName: "Dr. Smith",
      assistants: [{ profileId: "as-1", fullName: "Nurse A" }],
      createdAt: "2024-03-01T00:00:00Z",
      updatedAt: "2024-03-02T00:00:00Z",
    });
  });

  it("defaults a missing created_by_name to null", () => {
    const result = mapApiCalendarEvent(
      apiEvent({ created_by_name: undefined as unknown as null }),
    );
    expect(result.createdByName).toBeNull();
  });

  it("defaults missing assistants to an empty array", () => {
    const result = mapApiCalendarEvent(
      apiEvent({ assistants: undefined as unknown as [] }),
    );
    expect(result.assistants).toEqual([]);
  });

  it("preserves null branch/procedure/patient fields", () => {
    const result = mapApiCalendarEvent(
      apiEvent({
        branch_id: null,
        procedure_id: null,
        procedure_name: null,
        patient_id: null,
        patient_full_name: null,
      }),
    );
    expect(result.branchId).toBeNull();
    expect(result.procedureId).toBeNull();
    expect(result.procedureName).toBeNull();
    expect(result.patientId).toBeNull();
    expect(result.patientName).toBeNull();
  });
});
