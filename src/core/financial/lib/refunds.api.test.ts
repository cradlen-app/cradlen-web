import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiAuthFetch } from "@/infrastructure/http/api";
import { createRefund, fetchRefundsForInvoice, voidRefund } from "./refunds.api";

vi.mock("@/infrastructure/http/api", () => ({
  apiAuthFetch: vi.fn(),
}));

const mockFetch = vi.mocked(apiAuthFetch);
const BASE = "/organizations/org-1/refunds";

beforeEach(() => {
  vi.clearAllMocks();
  mockFetch.mockResolvedValue({ data: {}, meta: {} });
});

describe("refunds api", () => {
  it("fetchRefundsForInvoice filters by invoice_id", async () => {
    await fetchRefundsForInvoice("org-1", "inv-1");
    expect(mockFetch).toHaveBeenCalledWith(`${BASE}?invoice_id=inv-1`);
  });

  it("createRefund POSTs the payload", async () => {
    const payload = { payment_id: "pay-1", amount: 10 } as never;
    await createRefund("org-1", payload);
    expect(mockFetch).toHaveBeenCalledWith(BASE, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  });

  it("voidRefund POSTs to the void sub-path", async () => {
    await voidRefund("org-1", "r-1");
    expect(mockFetch).toHaveBeenCalledWith(`${BASE}/r-1/void`, { method: "POST" });
  });
});
