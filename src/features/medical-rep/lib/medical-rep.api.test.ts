import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiAuthFetch } from "@/infrastructure/http/api";
import {
  fetchMedicalRep,
  fetchMedicalRepMedications,
  fetchMedicalRepVisitHistory,
  fetchMedicalRepVisitHistoryByRep,
  fetchMedicalRepVisits,
  fetchMedicalReps,
} from "./medical-rep.api";

vi.mock("@/infrastructure/http/api", () => ({
  apiAuthFetch: vi.fn(),
}));

const mockFetch = vi.mocked(apiAuthFetch);

beforeEach(() => {
  vi.clearAllMocks();
  mockFetch.mockResolvedValue({} as never);
});

describe("fetchMedicalReps", () => {
  it("sends page and limit", () => {
    fetchMedicalReps({ page: 2, limit: 10, search: "" });
    expect(mockFetch).toHaveBeenCalledWith("/medical-reps?page=2&limit=10");
  });

  it("trims and adds search when present", () => {
    fetchMedicalReps({ page: 1, limit: 10, search: "  fatma  " });
    expect(mockFetch.mock.calls[0][0]).toContain("search=fatma");
  });

  it("omits search when blank", () => {
    fetchMedicalReps({ page: 1, limit: 10, search: "   " });
    expect(mockFetch.mock.calls[0][0]).not.toContain("search=");
  });
});

describe("fetchMedicalRep", () => {
  it("requests the rep by id", () => {
    fetchMedicalRep("rep-1");
    expect(mockFetch).toHaveBeenCalledWith("/medical-reps/rep-1");
  });
});

describe("fetchMedicalRepMedications", () => {
  it("requests the rep's linked medications", () => {
    fetchMedicalRepMedications("rep-1");
    expect(mockFetch).toHaveBeenCalledWith("/medical-reps/rep-1/medications");
  });
});

describe("fetchMedicalRepVisits", () => {
  it("uses a default limit of 20", () => {
    fetchMedicalRepVisits("rep-1");
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("/medical-rep-visits?");
    expect(url).toContain("medical_rep_id=rep-1");
    expect(url).toContain("limit=20");
  });

  it("honors an explicit limit", () => {
    fetchMedicalRepVisits("rep-1", 5);
    expect(mockFetch.mock.calls[0][0]).toContain("limit=5");
  });
});

describe("fetchMedicalRepVisitHistory", () => {
  it("targets the visit history endpoint with pagination", () => {
    fetchMedicalRepVisitHistory({ visitId: "v-1", page: 2, limit: 25 });
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("/medical-rep-visits/v-1/history?");
    expect(url).toContain("page=2");
    expect(url).toContain("limit=25");
  });
});

describe("fetchMedicalRepVisitHistoryByRep", () => {
  it("targets the rep visit-history endpoint with pagination", () => {
    fetchMedicalRepVisitHistoryByRep({ repId: "rep-7", page: 1, limit: 10 });
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("/medical-reps/rep-7/visit-history?");
    expect(url).toContain("page=1");
    expect(url).toContain("limit=10");
  });
});
