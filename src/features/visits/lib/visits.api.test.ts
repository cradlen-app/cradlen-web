import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiAuthFetch } from "@/infrastructure/http/api";
import type { ApiVisit } from "../types/visits.api.types";
import {
  bookVisit,
  cancelVisit,
  fetchBranchInProgress,
  fetchBranchVisitStats,
  fetchBranchWaitingList,
  fetchMyCurrentVisit,
  fetchMyWaitingList,
  fetchOrgVisitStats,
  fetchPatientJourneyTimeline,
  fetchPatientVisitHistory,
  fetchPatientVitalsTrend,
  fetchTodaysSchedule,
  fetchVisit,
  fetchVisitStats,
  searchPatients,
  startVisit,
  updateVisit,
  updateVisitStatus,
} from "./visits.api";

vi.mock("@/infrastructure/http/api", () => ({
  apiAuthFetch: vi.fn(),
}));

const mockFetch = vi.mocked(apiAuthFetch);

function lastUrl() {
  return mockFetch.mock.calls.at(-1)?.[0] as string;
}
function lastInit() {
  return mockFetch.mock.calls.at(-1)?.[1] as RequestInit | undefined;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockFetch.mockResolvedValue({ data: [] } as never);
});

describe("fetchVisitStats", () => {
  it("hits today-stats with no query when only branchId is given", async () => {
    await fetchVisitStats({ branchId: "br-1" });
    expect(lastUrl()).toBe("/branches/br-1/visits/today-stats");
  });

  it("appends date and assigned_to_me params", async () => {
    await fetchVisitStats({ branchId: "br-1", date: "2026-06-28", assignedToMe: true });
    expect(lastUrl()).toBe(
      "/branches/br-1/visits/today-stats?date=2026-06-28&assigned_to_me=true",
    );
  });

  it("omits assigned_to_me when false", async () => {
    await fetchVisitStats({ branchId: "br-1", assignedToMe: false });
    expect(lastUrl()).toBe("/branches/br-1/visits/today-stats");
  });
});

describe("branch / org monthly stats", () => {
  it("fetchBranchVisitStats without mine", async () => {
    await fetchBranchVisitStats("br-1");
    expect(lastUrl()).toBe("/branches/br-1/visits/stats");
  });

  it("fetchBranchVisitStats with mine appends assigned_to_me", async () => {
    await fetchBranchVisitStats("br-1", true);
    expect(lastUrl()).toBe("/branches/br-1/visits/stats?assigned_to_me=true");
  });

  it("fetchOrgVisitStats targets the org route", async () => {
    await fetchOrgVisitStats("org-1");
    expect(lastUrl()).toBe("/organizations/org-1/visits/stats");
  });
});

describe("paginated list endpoints", () => {
  it("waiting-list without pagination omits the query string", async () => {
    await fetchBranchWaitingList({ branchId: "br-1" });
    expect(lastUrl()).toBe("/branches/br-1/visits/waiting-list");
  });

  it("waiting-list with page + limit", async () => {
    await fetchBranchWaitingList({ branchId: "br-1", page: 2, limit: 10 });
    expect(lastUrl()).toBe("/branches/br-1/visits/waiting-list?page=2&limit=10");
  });

  it("in-progress with limit only", async () => {
    await fetchBranchInProgress({ branchId: "br-1", limit: 5 });
    expect(lastUrl()).toBe("/branches/br-1/visits/in-progress?limit=5");
  });

  it("my-waiting-list with page only", async () => {
    await fetchMyWaitingList({ branchId: "br-1", page: 3 });
    expect(lastUrl()).toBe("/branches/br-1/visits/my-waiting-list?page=3");
  });

  it("page=0 is treated as falsy and omitted", async () => {
    await fetchBranchWaitingList({ branchId: "br-1", page: 0, limit: 0 });
    expect(lastUrl()).toBe("/branches/br-1/visits/waiting-list");
  });
});

describe("single-resource reads", () => {
  it("fetchMyCurrentVisit", async () => {
    await fetchMyCurrentVisit("br-1");
    expect(lastUrl()).toBe("/branches/br-1/visits/my-current");
  });

  it("fetchVisit", async () => {
    await fetchVisit({ visitId: "v-1" });
    expect(lastUrl()).toBe("/visits/v-1");
  });
});

describe("fetchTodaysSchedule", () => {
  it("sets status=SCHEDULED and maps the list into schedule events", async () => {
    const apiVisit: ApiVisit = {
      id: "v-1",
      appointment_type: "VISIT",
      priority: "NORMAL",
      status: "SCHEDULED",
      scheduled_at: "2026-06-28T09:00:00.000Z",
      branch_id: "br-1",
      episode: {
        id: "ep-1",
        journey: { patient: { id: "p-1", full_name: "Sara" } },
      },
    } as ApiVisit;
    mockFetch.mockResolvedValueOnce({ data: [apiVisit] } as never);

    const res = await fetchTodaysSchedule({ branchId: "br-1" });
    expect(lastUrl()).toBe("/branches/br-1/visits?status=SCHEDULED");
    expect(res.data).toHaveLength(1);
    expect(res.data[0]).toMatchObject({ id: "v-1", kind: "visit", title: "Sara" });
  });

  it("adds from/to bounds when a date is supplied", async () => {
    mockFetch.mockResolvedValueOnce({ data: [] } as never);
    await fetchTodaysSchedule({ branchId: "br-1", date: "2026-06-28" });
    const url = lastUrl();
    expect(url).toContain("status=SCHEDULED");
    expect(url).toContain("from=2026-06-28T00%3A00%3A00Z");
    expect(url).toContain("to=2026-06-28T23%3A59%3A59Z");
  });
});

describe("searchPatients", () => {
  it("encodes the search term and caps the limit at 20", async () => {
    await searchPatients("sara m");
    expect(lastUrl()).toBe("/patients/search?search=sara+m&limit=20");
  });
});

describe("patient analytics reads", () => {
  it("fetchPatientVisitHistory uses default page/limit", async () => {
    await fetchPatientVisitHistory({ patientId: "p-1" });
    expect(lastUrl()).toBe("/patients/p-1/visits/history?page=1&limit=3");
  });

  it("fetchPatientVisitHistory passes exclude when present", async () => {
    await fetchPatientVisitHistory({ patientId: "p-1", page: 2, limit: 5, excludeVisitId: "v-9" });
    expect(lastUrl()).toBe("/patients/p-1/visits/history?page=2&limit=5&exclude=v-9");
  });

  it("fetchPatientJourneyTimeline uses default page=1 / limit=5", async () => {
    await fetchPatientJourneyTimeline({ patientId: "p-1" });
    expect(lastUrl()).toBe("/patients/p-1/journeys/timeline?page=1&limit=5");
  });

  it("fetchPatientVitalsTrend omits the query string without exclude", async () => {
    await fetchPatientVitalsTrend({ patientId: "p-1" });
    expect(lastUrl()).toBe("/patients/p-1/vitals-trend");
  });

  it("fetchPatientVitalsTrend appends exclude when present", async () => {
    await fetchPatientVitalsTrend({ patientId: "p-1", excludeVisitId: "v-9" });
    expect(lastUrl()).toBe("/patients/p-1/vitals-trend?exclude=v-9");
  });
});

describe("writes", () => {
  it("bookVisit POSTs the serialized body", async () => {
    const body = { patient_id: "p-1" } as never;
    await bookVisit(body);
    expect(lastUrl()).toBe("/visits/book");
    expect(lastInit()).toMatchObject({
      method: "POST",
      body: JSON.stringify(body),
    });
  });

  it("startVisit PATCHes status to IN_CONSULTATION", async () => {
    await startVisit({ visitId: "v-1" });
    expect(lastUrl()).toBe("/visits/v-1/status");
    expect(lastInit()).toMatchObject({
      method: "PATCH",
      body: JSON.stringify({ status: "IN_CONSULTATION" }),
    });
  });

  it("cancelVisit PATCHes status to CANCELLED", async () => {
    await cancelVisit({ visitId: "v-1" });
    expect(lastUrl()).toBe("/visits/v-1/status");
    expect(lastInit()).toMatchObject({
      method: "PATCH",
      body: JSON.stringify({ status: "CANCELLED" }),
    });
  });

  it("updateVisitStatus PATCHes the supplied status body", async () => {
    await updateVisitStatus({ visitId: "v-1", body: { status: "NO_SHOW" } });
    expect(lastUrl()).toBe("/visits/v-1/status");
    expect(lastInit()).toMatchObject({
      method: "PATCH",
      body: JSON.stringify({ status: "NO_SHOW" }),
    });
  });

  it("updateVisit PATCHes the visit resource", async () => {
    await updateVisit({ visitId: "v-1", body: { notes: "hi" } });
    expect(lastUrl()).toBe("/visits/v-1");
    expect(lastInit()).toMatchObject({
      method: "PATCH",
      body: JSON.stringify({ notes: "hi" }),
    });
  });
});
