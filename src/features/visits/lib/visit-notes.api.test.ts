import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiAuthFetch } from "@/infrastructure/http/api";
import {
  createVisitNote,
  deleteVisitNote,
  fetchPatientVisitNotes,
  fetchVisitNotes,
  updateVisitNote,
} from "./visit-notes.api";

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

const apiNote = {
  id: "n-1",
  visit_id: "v-1",
  content: "Fatigue x3 weeks",
  added_after_close: true,
  created_at: "2026-07-26T10:00:00.000Z",
  updated_at: "2026-07-26T10:05:00.000Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  mockFetch.mockResolvedValue({ data: [] } as never);
});

describe("fetchVisitNotes", () => {
  it("hits the visit-scoped path and maps snake_case to camelCase", async () => {
    mockFetch.mockResolvedValue({ data: [apiNote] } as never);

    const notes = await fetchVisitNotes("v-1");

    expect(lastUrl()).toBe("/visits/v-1/notes");
    expect(notes).toEqual([
      {
        id: "n-1",
        visitId: "v-1",
        content: "Fatigue x3 weeks",
        addedAfterClose: true,
        createdAt: "2026-07-26T10:00:00.000Z",
        updatedAt: "2026-07-26T10:05:00.000Z",
      },
    ]);
  });
});

describe("fetchPatientVisitNotes", () => {
  // ResponseInterceptor flattens paginated payloads: `data` is the array and
  // `meta` is top-level, not nested under `data`.
  it("unwraps the flattened paginated envelope and carries the visit fields through", async () => {
    mockFetch.mockResolvedValue({
      data: [
        {
          ...apiNote,
          visit_scheduled_at: "2026-06-12T09:00:00.000Z",
          visit_status: "COMPLETED",
        },
      ],
      meta: { total: 1, page: 1, limit: 50, totalPages: 1 },
    } as never);

    const res = await fetchPatientVisitNotes({ patientId: "p-1" });

    expect(lastUrl()).toBe("/patients/p-1/visit-notes?limit=50");
    expect(res.total).toBe(1);
    expect(res.items[0]).toMatchObject({
      id: "n-1",
      visitScheduledAt: "2026-06-12T09:00:00.000Z",
      visitStatus: "COMPLETED",
    });
  });

  it("passes page and limit through", async () => {
    mockFetch.mockResolvedValue({
      data: [],
      meta: { total: 0, page: 2, limit: 10, totalPages: 0 },
    } as never);

    await fetchPatientVisitNotes({ patientId: "p-1", page: 2, limit: 10 });

    expect(lastUrl()).toBe("/patients/p-1/visit-notes?page=2&limit=10");
  });
});

describe("write paths", () => {
  it("POSTs the note content", async () => {
    mockFetch.mockResolvedValue({ data: apiNote } as never);

    await createVisitNote("v-1", "Recheck CBC");

    expect(lastUrl()).toBe("/visits/v-1/notes");
    expect(lastInit()?.method).toBe("POST");
    expect(JSON.parse(lastInit()?.body as string)).toEqual({
      content: "Recheck CBC",
    });
  });

  it("PATCHes an individual note under its visit", async () => {
    mockFetch.mockResolvedValue({ data: apiNote } as never);

    await updateVisitNote("v-1", "n-1", "edited");

    expect(lastUrl()).toBe("/visits/v-1/notes/n-1");
    expect(lastInit()?.method).toBe("PATCH");
    expect(JSON.parse(lastInit()?.body as string)).toEqual({
      content: "edited",
    });
  });

  // visitId must stay in the path — the server's closed-visit guard reads it.
  it("DELETEs an individual note under its visit", async () => {
    mockFetch.mockResolvedValue(undefined as never);

    await deleteVisitNote("v-1", "n-1");

    expect(lastUrl()).toBe("/visits/v-1/notes/n-1");
    expect(lastInit()?.method).toBe("DELETE");
  });
});
