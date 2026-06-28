import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiAuthFetch } from "@/infrastructure/http/api";
import {
  createMedication,
  deleteMedication,
  fetchMedicationFacets,
  fetchMedications,
  updateMedication,
} from "./medications.api";

vi.mock("@/infrastructure/http/api", () => ({
  apiAuthFetch: vi.fn(),
}));

const mockFetch = vi.mocked(apiAuthFetch);

const baseParams = {
  page: 1,
  limit: 20,
  search: "",
};

beforeEach(() => {
  vi.clearAllMocks();
  mockFetch.mockResolvedValue({} as never);
});

describe("fetchMedications", () => {
  it("always sends page and limit", () => {
    fetchMedications(baseParams);
    expect(mockFetch).toHaveBeenCalledWith("/medications?page=1&limit=20");
  });

  it("trims and includes search when present", () => {
    fetchMedications({ ...baseParams, search: "  amox  " });
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("search=amox");
  });

  it("omits search when only whitespace", () => {
    fetchMedications({ ...baseParams, search: "   " });
    expect(mockFetch.mock.calls[0][0]).not.toContain("search=");
  });

  it("includes category and form filters when given", () => {
    fetchMedications({ ...baseParams, category: "Antibiotic", form: "Tablet" });
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("category=Antibiotic");
    expect(url).toContain("form=Tablet");
  });

  it("includes a non-default sort but omits the default name_asc", () => {
    fetchMedications({ ...baseParams, sort: "usage" });
    expect(mockFetch.mock.calls[0][0]).toContain("sort=usage");

    mockFetch.mockClear();
    fetchMedications({ ...baseParams, sort: "name_asc" });
    expect(mockFetch.mock.calls[0][0]).not.toContain("sort=");
  });
});

describe("fetchMedicationFacets", () => {
  it("unwraps the data envelope", async () => {
    const facets = { categories: [], forms: [] };
    mockFetch.mockResolvedValueOnce({ data: facets } as never);
    await expect(fetchMedicationFacets()).resolves.toBe(facets);
    expect(mockFetch).toHaveBeenCalledWith("/medications/facets");
  });
});

describe("createMedication", () => {
  it("POSTs a JSON body to /medications", () => {
    const data = { name: "Amox" } as never;
    createMedication(data);
    expect(mockFetch).toHaveBeenCalledWith("/medications", {
      method: "POST",
      body: JSON.stringify(data),
    });
  });
});

describe("updateMedication", () => {
  it("PATCHes the medication by id", () => {
    const data = { name: "New" } as never;
    updateMedication("med-1", data);
    expect(mockFetch).toHaveBeenCalledWith("/medications/med-1", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  });
});

describe("deleteMedication", () => {
  it("DELETEs the medication by id", () => {
    deleteMedication("med-9");
    expect(mockFetch).toHaveBeenCalledWith("/medications/med-9", {
      method: "DELETE",
    });
  });
});
