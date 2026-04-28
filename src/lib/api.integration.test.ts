import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "./api";

describe("apiFetch", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("routes token-issuing auth calls through local route handlers", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ data: { authenticated: true } }), {
        status: 200,
      }),
    );

    await expect(
      apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "doctor@example.com", password: "password123" }),
      }),
    ).resolves.toEqual({ data: { authenticated: true } });

    expect(fetch).toHaveBeenCalledWith(
      "/api/auth/login",
      expect.objectContaining({
        credentials: "include",
        method: "POST",
      }),
    );
  });

  it("preserves backend error messages in ApiError", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ message: ["Invalid email or password"] }), {
        status: 401,
        statusText: "Unauthorized",
      }),
    );

    await expect(apiFetch("/auth/login")).rejects.toMatchObject({
      status: 401,
      messages: ["Invalid email or password"],
    });
  });
});
