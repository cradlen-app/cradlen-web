import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiAuthFetch } from "@/infrastructure/http/api";
import { fetchVisitJourney } from "./journeys.api";
import { fetchActiveJourneySummary } from "./active-journey-summary.api";

vi.mock("@/infrastructure/http/api", () => ({
  apiAuthFetch: vi.fn(),
}));

const mockFetch = vi.mocked(apiAuthFetch);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("fetchVisitJourney", () => {
  it("requests the encoded visit journey and unwraps the data envelope", async () => {
    const descriptor = { journey_id: "j-1" };
    mockFetch.mockResolvedValueOnce({ data: descriptor } as never);

    await expect(fetchVisitJourney("v 1")).resolves.toBe(descriptor);
    expect(mockFetch).toHaveBeenCalledWith("/visits/v%201/journey", {
      signal: undefined,
    });
  });

  it("returns null when the visit has no journey", async () => {
    mockFetch.mockResolvedValueOnce({ data: null } as never);
    await expect(fetchVisitJourney("v-1")).resolves.toBeNull();
  });

  it("forwards an abort signal", async () => {
    mockFetch.mockResolvedValueOnce({ data: null } as never);
    const controller = new AbortController();
    await fetchVisitJourney("v-1", controller.signal);
    expect(mockFetch).toHaveBeenCalledWith("/visits/v-1/journey", {
      signal: controller.signal,
    });
  });
});

describe("fetchActiveJourneySummary", () => {
  it("requests the patient active-journey summary", () => {
    mockFetch.mockResolvedValueOnce({ data: {} } as never);
    fetchActiveJourneySummary("p-9");
    expect(mockFetch).toHaveBeenCalledWith(
      "/patients/p-9/active-journey-summary",
    );
  });
});
