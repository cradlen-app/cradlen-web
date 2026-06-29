import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiAuthFetch } from "@/infrastructure/http/api";
import type {
  ApiCalendarEvent,
  ApiCalendarEventResponse,
  ApiCalendarEventsResponse,
} from "../types/calendar.api.types";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  fetchCalendarEvent,
  fetchCalendarEvents,
  fetchProcedures,
  updateCalendarEvent,
} from "./calendar.api";

vi.mock("@/infrastructure/http/api", () => ({
  apiAuthFetch: vi.fn(),
}));

const mockFetch = vi.mocked(apiAuthFetch);

function apiEvent(id = "id-1"): ApiCalendarEvent {
  return {
    id,
    profile_id: "prof-1",
    organization_id: "org-1",
    branch_id: "branch-1",
    event_type: "GENERIC",
    visibility: "PRIVATE",
    title: "Event",
    description: null,
    start_at: "2024-03-10T09:00:00Z",
    end_at: "2024-03-10T10:00:00Z",
    all_day: false,
    procedure_id: null,
    patient_id: null,
    procedure_name: null,
    patient_full_name: null,
    created_by_name: null,
    assistants: [],
    created_at: "2024-03-01T00:00:00Z",
    updated_at: "2024-03-01T00:00:00Z",
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("fetchCalendarEvents", () => {
  it("builds the query string with required and defaulted params, then maps each row", async () => {
    const resp: ApiCalendarEventsResponse = {
      data: [apiEvent("a"), apiEvent("b")],
      meta: {},
    };
    mockFetch.mockResolvedValueOnce(resp);

    const events = await fetchCalendarEvents({
      from: "2024-03-01",
      to: "2024-03-31",
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const url = new URL(
      "https://x.test" + (mockFetch.mock.calls[0][0] as string),
    );
    expect(url.pathname).toBe("/calendar/events");
    expect(url.searchParams.get("from")).toBe("2024-03-01");
    expect(url.searchParams.get("to")).toBe("2024-03-31");
    // limit defaults to 200; optional params are omitted.
    expect(url.searchParams.get("limit")).toBe("200");
    expect(url.searchParams.get("profile_id")).toBeNull();
    expect(url.searchParams.get("branch_id")).toBeNull();
    expect(url.searchParams.get("event_type")).toBeNull();
    expect(url.searchParams.get("page")).toBeNull();

    expect(events.map((e) => e.id)).toEqual(["a", "b"]);
    expect(events[0].type).toBe("GENERIC");
  });

  it("appends every optional filter when supplied", async () => {
    mockFetch.mockResolvedValueOnce({ data: [], meta: {} });

    await fetchCalendarEvents({
      from: "2024-03-01",
      to: "2024-03-31",
      profileId: "prof-9",
      branchId: "branch-9",
      type: "PROCEDURE",
      visibility: "ORGANIZATION",
      limit: 50,
      page: 2,
    });

    const url = new URL(
      "https://x.test" + (mockFetch.mock.calls[0][0] as string),
    );
    expect(url.searchParams.get("profile_id")).toBe("prof-9");
    expect(url.searchParams.get("branch_id")).toBe("branch-9");
    expect(url.searchParams.get("event_type")).toBe("PROCEDURE");
    expect(url.searchParams.get("visibility")).toBe("ORGANIZATION");
    expect(url.searchParams.get("limit")).toBe("50");
    expect(url.searchParams.get("page")).toBe("2");
  });

  it("does not set page when page is 0 (falsy)", async () => {
    mockFetch.mockResolvedValueOnce({ data: [], meta: {} });
    await fetchCalendarEvents({ from: "a", to: "b", page: 0 });
    const url = new URL(
      "https://x.test" + (mockFetch.mock.calls[0][0] as string),
    );
    expect(url.searchParams.get("page")).toBeNull();
  });
});

describe("fetchCalendarEvent", () => {
  it("GETs the event by id and maps the payload", async () => {
    const resp: ApiCalendarEventResponse = { data: apiEvent("z"), meta: {} };
    mockFetch.mockResolvedValueOnce(resp);

    const event = await fetchCalendarEvent("z");

    expect(mockFetch).toHaveBeenCalledWith("/calendar/events/z");
    expect(event.id).toBe("z");
    expect(event.startsAt).toBe("2024-03-10T09:00:00Z");
  });
});

describe("createCalendarEvent", () => {
  it("POSTs the JSON body and returns the mapped event", async () => {
    mockFetch.mockResolvedValueOnce({ data: apiEvent("new"), meta: {} });

    const body = {
      event_type: "GENERIC" as const,
      title: "New",
      start_at: "2024-03-10T09:00:00Z",
      end_at: "2024-03-10T10:00:00Z",
    };
    const event = await createCalendarEvent(body);

    expect(mockFetch).toHaveBeenCalledWith("/calendar/events", {
      method: "POST",
      body: JSON.stringify(body),
    });
    expect(event.id).toBe("new");
  });
});

describe("updateCalendarEvent", () => {
  it("PATCHes the event by id with the JSON body", async () => {
    mockFetch.mockResolvedValueOnce({ data: apiEvent("u"), meta: {} });

    const event = await updateCalendarEvent("u", { title: "Renamed" });

    expect(mockFetch).toHaveBeenCalledWith("/calendar/events/u", {
      method: "PATCH",
      body: JSON.stringify({ title: "Renamed" }),
    });
    expect(event.id).toBe("u");
  });
});

describe("deleteCalendarEvent", () => {
  it("DELETEs the event by id and resolves void", async () => {
    mockFetch.mockResolvedValueOnce(undefined);
    await expect(deleteCalendarEvent("d")).resolves.toBeUndefined();
    expect(mockFetch).toHaveBeenCalledWith("/calendar/events/d", {
      method: "DELETE",
    });
  });
});

describe("fetchProcedures", () => {
  it("requests /procedures with no query string when no search term", async () => {
    mockFetch.mockResolvedValueOnce({ data: [], meta: {} });
    const out = await fetchProcedures();
    expect(mockFetch).toHaveBeenCalledWith("/procedures");
    expect(out).toEqual([]);
  });

  it("URL-encodes the search term and returns the lookup data verbatim", async () => {
    const items = [
      { id: "p1", code: "C1", name: "Proc 1", specialty: null },
    ];
    mockFetch.mockResolvedValueOnce({ data: items, meta: {} });

    const out = await fetchProcedures("knee surgery");

    expect(mockFetch).toHaveBeenCalledWith("/procedures?search=knee+surgery");
    expect(out).toBe(items);
  });
});
