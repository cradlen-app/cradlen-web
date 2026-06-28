import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiAuthFetch } from "@/infrastructure/http/api";
import {
  captureCharge,
  fetchCharges,
  fetchVisitCharges,
  updateCharge,
} from "./charging.api";

vi.mock("@/infrastructure/http/api", () => ({
  apiAuthFetch: vi.fn(),
}));

const mockFetch = vi.mocked(apiAuthFetch);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("fetchCharges", () => {
  it("builds a query string from the supplied options", async () => {
    mockFetch.mockResolvedValue({ data: [], meta: {} });
    await fetchCharges("org-1", {
      patient_id: "p-1",
      visit_id: "v-1",
      branch_id: "b-1",
      status: "PENDING",
      page: 2,
      limit: 10,
    });
    expect(mockFetch).toHaveBeenCalledWith(
      "/organizations/org-1/financial/charges?patient_id=p-1&visit_id=v-1&branch_id=b-1&status=PENDING&page=2&limit=10",
    );
  });

  it("omits the query string when no options are given", async () => {
    mockFetch.mockResolvedValue({ data: [], meta: {} });
    await fetchCharges("org-1");
    expect(mockFetch).toHaveBeenCalledWith("/organizations/org-1/financial/charges");
  });

  it("includes page=0 (uses != null guard, not truthiness)", async () => {
    mockFetch.mockResolvedValue({ data: [], meta: {} });
    await fetchCharges("org-1", { page: 0, limit: 0 });
    expect(mockFetch).toHaveBeenCalledWith(
      "/organizations/org-1/financial/charges?page=0&limit=0",
    );
  });

  it("coerces string unit_price into a number at the boundary", async () => {
    mockFetch.mockResolvedValue({
      data: [
        { id: "c-1", unit_price: "150.50" },
        { id: "c-2", unit_price: 99 },
        { id: "c-3", unit_price: null },
      ],
      meta: {},
    });
    const res = await fetchCharges("org-1");
    expect(res.data.map((c) => c.unit_price)).toEqual([150.5, 99, 0]);
  });
});

describe("fetchVisitCharges", () => {
  it("hits the by-visit endpoint and normalizes nested charges", async () => {
    mockFetch.mockResolvedValue({
      data: {
        charges: [{ id: "c-1", unit_price: "20" }],
        summary: { currency: "EGP", pending_total: "20", charge_count: 1 },
      },
      meta: {},
    });
    const res = await fetchVisitCharges("org-1", "v-9");
    expect(mockFetch).toHaveBeenCalledWith(
      "/organizations/org-1/financial/charges/visit/v-9",
    );
    expect(res.data.charges[0].unit_price).toBe(20);
    expect(res.data.summary.currency).toBe("EGP");
  });
});

describe("captureCharge", () => {
  it("POSTs the payload to the charges base", async () => {
    mockFetch.mockResolvedValue({ data: {}, meta: {} });
    const payload = { patient_id: "p-1", description: "X", quantity: 1 } as never;
    await captureCharge("org-1", payload);
    expect(mockFetch).toHaveBeenCalledWith("/organizations/org-1/financial/charges", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  });
});

describe("updateCharge", () => {
  it("PATCHes the charge by id", async () => {
    mockFetch.mockResolvedValue({ data: {}, meta: {} });
    const payload = { description: "Y" } as never;
    await updateCharge("org-1", "c-7", payload);
    expect(mockFetch).toHaveBeenCalledWith(
      "/organizations/org-1/financial/charges/c-7",
      { method: "PATCH", body: JSON.stringify(payload) },
    );
  });
});
