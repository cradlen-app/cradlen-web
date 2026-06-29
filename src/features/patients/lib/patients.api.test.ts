import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiAuthFetch } from "@/infrastructure/http/api";
import {
  fetchBranchPatientStats,
  fetchBranchPatients,
  fetchOrgPatientStats,
  fetchOrgPatients,
  fetchPatientById,
  updatePatient,
} from "./patients.api";

vi.mock("@/infrastructure/http/api", () => ({
  apiAuthFetch: vi.fn(),
}));

const mockFetch = vi.mocked(apiAuthFetch);

beforeEach(() => {
  vi.clearAllMocks();
  mockFetch.mockResolvedValue({} as never);
});

describe("fetchPatientById", () => {
  it("requests the patient by id", () => {
    fetchPatientById("p-1");
    expect(mockFetch).toHaveBeenCalledWith("/patients/p-1");
  });
});

describe("updatePatient", () => {
  it("PATCHes the patient with a JSON body", () => {
    const data = { full_name: "Jane Doe" };
    updatePatient("p-1", data);
    expect(mockFetch).toHaveBeenCalledWith("/patients/p-1", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  });
});

describe("fetchBranchPatients", () => {
  it("hits the branch patients endpoint with no query when params are empty", () => {
    fetchBranchPatients("b-1");
    expect(mockFetch).toHaveBeenCalledWith("/branches/b-1/patients");
  });

  it("appends each provided filter to the query string", () => {
    fetchBranchPatients("b-1", {
      search: "ali",
      journey_status: "ACTIVE" as never,
      journey_type: "PREGNANCY" as never,
      page: 2,
      limit: 50,
      assigned_to_me: true,
    });
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url.startsWith("/branches/b-1/patients?")).toBe(true);
    expect(url).toContain("search=ali");
    expect(url).toContain("journey_status=ACTIVE");
    expect(url).toContain("journey_type=PREGNANCY");
    expect(url).toContain("page=2");
    expect(url).toContain("limit=50");
    expect(url).toContain("assigned_to_me=true");
  });

  it("omits assigned_to_me when false", () => {
    fetchBranchPatients("b-1", { assigned_to_me: false });
    expect(mockFetch).toHaveBeenCalledWith("/branches/b-1/patients");
  });
});

describe("fetchOrgPatients", () => {
  it("hits the org directory endpoint", () => {
    fetchOrgPatients();
    expect(mockFetch).toHaveBeenCalledWith("/patients/directory");
  });

  it("carries filters into the directory query", () => {
    fetchOrgPatients({ search: "noor" });
    expect(mockFetch.mock.calls[0][0]).toBe("/patients/directory?search=noor");
  });
});

describe("fetchBranchPatientStats", () => {
  it("defaults to org-scoped stats (no mine flag)", () => {
    fetchBranchPatientStats("b-1");
    expect(mockFetch).toHaveBeenCalledWith("/branches/b-1/patients/stats");
  });

  it("adds the assigned_to_me flag when mine is true", () => {
    fetchBranchPatientStats("b-1", true);
    expect(mockFetch).toHaveBeenCalledWith(
      "/branches/b-1/patients/stats?assigned_to_me=true",
    );
  });
});

describe("fetchOrgPatientStats", () => {
  it("requests org-wide stats", () => {
    fetchOrgPatientStats();
    expect(mockFetch).toHaveBeenCalledWith("/patients/stats");
  });
});
