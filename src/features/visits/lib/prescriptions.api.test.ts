import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiAuthFetch } from "@/infrastructure/http/api";
import { fetchPrescriptionPrint } from "./prescriptions.api";

vi.mock("@/infrastructure/http/api", () => ({
  apiAuthFetch: vi.fn(),
}));

const mockFetch = vi.mocked(apiAuthFetch);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("fetchPrescriptionPrint", () => {
  it("requests the print endpoint for the visit and returns the response", async () => {
    const payload = { data: { template: { id: "t-1" }, document: {} } };
    mockFetch.mockResolvedValueOnce(payload as never);

    const res = await fetchPrescriptionPrint("v-1");

    expect(mockFetch).toHaveBeenCalledWith("/visits/v-1/prescription/print");
    expect(res).toBe(payload);
  });

  it("propagates a rejection (e.g. 404 nothing-to-print)", async () => {
    mockFetch.mockRejectedValueOnce(new Error("not found"));
    await expect(fetchPrescriptionPrint("v-2")).rejects.toThrow("not found");
  });
});
