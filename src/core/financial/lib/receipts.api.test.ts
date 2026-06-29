import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiAuthFetch } from "@/infrastructure/http/api";
import {
  fetchReceipt,
  fetchReceiptPrint,
  fetchReceiptsForInvoice,
} from "./receipts.api";

vi.mock("@/infrastructure/http/api", () => ({
  apiAuthFetch: vi.fn(),
}));

const mockFetch = vi.mocked(apiAuthFetch);
const BASE = "/organizations/org-1/receipts";

beforeEach(() => {
  vi.clearAllMocks();
  mockFetch.mockResolvedValue({ data: {}, meta: {} });
});

describe("receipts api", () => {
  it("fetchReceiptsForInvoice filters by invoice_id", async () => {
    await fetchReceiptsForInvoice("org-1", "inv-1");
    expect(mockFetch).toHaveBeenCalledWith(`${BASE}?invoice_id=inv-1`);
  });

  it("fetchReceipt GETs by id", async () => {
    await fetchReceipt("org-1", "rc-1");
    expect(mockFetch).toHaveBeenCalledWith(`${BASE}/rc-1`);
  });

  it("fetchReceiptPrint GETs the print sub-path", async () => {
    await fetchReceiptPrint("org-1", "rc-1");
    expect(mockFetch).toHaveBeenCalledWith(`${BASE}/rc-1/print`);
  });
});
