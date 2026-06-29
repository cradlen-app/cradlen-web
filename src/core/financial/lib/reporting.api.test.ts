import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiAuthFetch } from "@/infrastructure/http/api";
import { fetchReport } from "./reporting.api";

vi.mock("@/infrastructure/http/api", () => ({
  apiAuthFetch: vi.fn(),
}));

const mockFetch = vi.mocked(apiAuthFetch);
const BASE = "/organizations/org-1/financial/reports";

beforeEach(() => {
  vi.clearAllMocks();
  mockFetch.mockResolvedValue({ data: {}, meta: {} });
});

describe("fetchReport", () => {
  it("builds the endpoint from the report name without params", async () => {
    await fetchReport("org-1", "daily-revenue");
    expect(mockFetch).toHaveBeenCalledWith(`${BASE}/daily-revenue`);
  });

  it("serializes all report params", async () => {
    await fetchReport("org-1", "revenue", {
      branch_id: "b-1",
      date_from: "2026-01-01",
      date_to: "2026-01-31",
      doctor_id: "d-1",
    });
    expect(mockFetch).toHaveBeenCalledWith(
      `${BASE}/revenue?branch_id=b-1&date_from=2026-01-01&date_to=2026-01-31&doctor_id=d-1`,
    );
  });

  it("omits the query string when params are empty", async () => {
    await fetchReport("org-1", "ar-aging", {});
    expect(mockFetch).toHaveBeenCalledWith(`${BASE}/ar-aging`);
  });

  it("includes only the provided params", async () => {
    await fetchReport("org-1", "revenue", { date_from: "2026-01-01" });
    expect(mockFetch).toHaveBeenCalledWith(`${BASE}/revenue?date_from=2026-01-01`);
  });
});
