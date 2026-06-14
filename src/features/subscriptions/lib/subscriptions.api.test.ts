import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiAuthFetch } from "@/infrastructure/http/api";
import { uploadProof } from "./subscriptions.api";

vi.mock("@/infrastructure/http/api", () => ({
  apiAuthFetch: vi.fn(),
}));

const mockApiAuthFetch = vi.mocked(apiAuthFetch);

describe("uploadProof", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requests a presigned URL, PUTs the bytes to R2, then confirms the key", async () => {
    const file = new File(["x"], "receipt.png", { type: "image/png" });
    mockApiAuthFetch
      .mockResolvedValueOnce({
        data: {
          key: "subscription-payments/pay-1/proofs/abc.png",
          upload_url: "https://r2.test/put",
          expires_in: 300,
          content_type: "image/png",
        },
      })
      .mockResolvedValueOnce({ data: { id: "pay-1" } });

    const putSpy = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", putSpy);

    await uploadProof("org-1", "pay-1", file);

    // 1) presigned-url request
    expect(mockApiAuthFetch).toHaveBeenNthCalledWith(
      1,
      "/organizations/org-1/subscription/payments/pay-1/proof/upload-url",
      expect.objectContaining({ method: "POST" }),
    );
    // 2) direct PUT to R2
    expect(putSpy).toHaveBeenCalledWith(
      "https://r2.test/put",
      expect.objectContaining({ method: "PUT" }),
    );
    // 3) confirm with the server-issued key
    expect(mockApiAuthFetch).toHaveBeenNthCalledWith(
      2,
      "/organizations/org-1/subscription/payments/pay-1/proof",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          key: "subscription-payments/pay-1/proofs/abc.png",
        }),
      }),
    );
  });

  it("throws and does not confirm when the R2 upload fails", async () => {
    const file = new File(["x"], "receipt.png", { type: "image/png" });
    mockApiAuthFetch.mockResolvedValueOnce({
      data: {
        key: "subscription-payments/pay-1/proofs/abc.png",
        upload_url: "https://r2.test/put",
        expires_in: 300,
        content_type: "image/png",
      },
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

    await expect(uploadProof("org-1", "pay-1", file)).rejects.toThrow();
    expect(mockApiAuthFetch).toHaveBeenCalledTimes(1); // no confirm call
  });
});
