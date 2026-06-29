import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiAuthFetch } from "@/infrastructure/http/api";
import {
  closeCashSession,
  fetchCashSession,
  fetchCashSessions,
  fetchCurrentCashSession,
  openCashSession,
  reconcileCashSession,
} from "./cash.api";

vi.mock("@/infrastructure/http/api", () => ({
  apiAuthFetch: vi.fn(),
}));

const mockFetch = vi.mocked(apiAuthFetch);
const BASE = "/organizations/org-1/financial/cash-sessions";

beforeEach(() => {
  vi.clearAllMocks();
  mockFetch.mockResolvedValue({ data: {}, meta: {} });
});

describe("cash sessions reads", () => {
  it("fetchCashSessions serializes all options", async () => {
    await fetchCashSessions("org-1", {
      branch_id: "b-1",
      status: "OPEN",
      page: 1,
      limit: 20,
    });
    expect(mockFetch).toHaveBeenCalledWith(
      `${BASE}?branch_id=b-1&status=OPEN&page=1&limit=20`,
    );
  });

  it("fetchCashSessions omits the query string when no options", async () => {
    await fetchCashSessions("org-1");
    expect(mockFetch).toHaveBeenCalledWith(BASE);
  });

  it("fetchCurrentCashSession requires a branch_id", async () => {
    await fetchCurrentCashSession("org-1", "b-1");
    expect(mockFetch).toHaveBeenCalledWith(`${BASE}/current?branch_id=b-1`);
  });

  it("fetchCashSession GETs by id", async () => {
    await fetchCashSession("org-1", "cs-1");
    expect(mockFetch).toHaveBeenCalledWith(`${BASE}/cs-1`);
  });
});

describe("cash sessions writes", () => {
  it("openCashSession POSTs the payload to the base", async () => {
    const payload = { branch_id: "b-1", opening_float: 100 } as never;
    await openCashSession("org-1", payload);
    expect(mockFetch).toHaveBeenCalledWith(BASE, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  });

  it("closeCashSession POSTs to the close sub-path", async () => {
    const payload = { counted_amount: 200 } as never;
    await closeCashSession("org-1", "cs-1", payload);
    expect(mockFetch).toHaveBeenCalledWith(`${BASE}/cs-1/close`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  });

  it("reconcileCashSession POSTs to the reconcile sub-path", async () => {
    await reconcileCashSession("org-1", "cs-1");
    expect(mockFetch).toHaveBeenCalledWith(`${BASE}/cs-1/reconcile`, {
      method: "POST",
    });
  });
});
