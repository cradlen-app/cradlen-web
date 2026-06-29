import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Thin route handlers that delegate to the shared backend proxy helpers. The
// tests pin the wiring: the right helper is called with the right backend path
// and the incoming request, and the helper's response is returned verbatim.
vi.mock("@/infrastructure/auth-transport/backend", () => ({
  proxyAuthenticatedRequest: vi.fn(),
  proxySessionEndpoint: vi.fn(),
}));

import {
  proxyAuthenticatedRequest,
  proxySessionEndpoint,
} from "@/infrastructure/auth-transport/backend";

const proxyAuthenticatedRequestMock = vi.mocked(proxyAuthenticatedRequest);
const proxySessionEndpointMock = vi.mocked(proxySessionEndpoint);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/auth/me", () => {
  it("proxies the authenticated request to /auth/me", async () => {
    const sentinel = new Response("me");
    proxyAuthenticatedRequestMock.mockResolvedValue(sentinel as never);

    const { GET } = await import("./me/route");
    const req = new NextRequest("http://localhost/api/auth/me");
    const res = await GET(req);

    expect(proxyAuthenticatedRequestMock).toHaveBeenCalledWith(req, "/auth/me");
    expect(res).toBe(sentinel);
  });
});

describe("POST /api/auth/ws-ticket", () => {
  it("proxies the authenticated request to /auth/ws-ticket", async () => {
    const sentinel = new Response("ws");
    proxyAuthenticatedRequestMock.mockResolvedValue(sentinel as never);

    const { POST } = await import("./ws-ticket/route");
    const req = new NextRequest("http://localhost/api/auth/ws-ticket", {
      method: "POST",
    });
    const res = await POST(req);

    expect(proxyAuthenticatedRequestMock).toHaveBeenCalledWith(req, "/auth/ws-ticket");
    expect(res).toBe(sentinel);
  });
});

describe("POST /api/auth/register-organization", () => {
  it("proxies the session endpoint to /auth/register/organization", async () => {
    const sentinel = new Response("register");
    proxySessionEndpointMock.mockResolvedValue(sentinel as never);

    const { POST } = await import("./register-organization/route");
    const req = new Request("http://localhost/api/auth/register-organization", {
      method: "POST",
    });
    const res = await POST(req);

    expect(proxySessionEndpointMock).toHaveBeenCalledWith(
      "/auth/register/organization",
      req,
    );
    expect(res).toBe(sentinel);
  });
});

describe("POST /api/auth/reset-password", () => {
  it("proxies the session endpoint to /auth/reset-password", async () => {
    const sentinel = new Response("reset");
    proxySessionEndpointMock.mockResolvedValue(sentinel as never);

    const { POST } = await import("./reset-password/route");
    const req = new Request("http://localhost/api/auth/reset-password", {
      method: "POST",
    });
    const res = await POST(req);

    expect(proxySessionEndpointMock).toHaveBeenCalledWith("/auth/reset-password", req);
    expect(res).toBe(sentinel);
  });
});
