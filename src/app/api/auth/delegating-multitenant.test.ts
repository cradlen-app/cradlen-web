import { describe, it, expect, vi, beforeEach } from "vitest";

// Thin route handlers that delegate entirely to the multi-tenant-auth helpers.
// These tests pin the wiring: each handler must forward the incoming request to
// the correct helper (and, where relevant, the correct backend path) and return
// whatever the helper produces unchanged.
vi.mock("@/infrastructure/auth-transport/multi-tenant-auth", () => ({
  profileSelectionResponse: vi.fn(),
  selectProfileSession: vi.fn(),
  switchBranchSession: vi.fn(),
}));

import {
  profileSelectionResponse,
  selectProfileSession,
  switchBranchSession,
} from "@/infrastructure/auth-transport/multi-tenant-auth";

const profileSelectionResponseMock = vi.mocked(profileSelectionResponse);
const selectProfileSessionMock = vi.mocked(selectProfileSession);
const switchBranchSessionMock = vi.mocked(switchBranchSession);

function makeRequest(url: string) {
  return new Request(url, { method: "POST", body: JSON.stringify({ a: 1 }) });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/auth/login", () => {
  it("delegates to profileSelectionResponse with the login path", async () => {
    const sentinel = new Response("login");
    profileSelectionResponseMock.mockResolvedValue(sentinel as never);

    const { POST } = await import("./login/route");
    const req = makeRequest("http://localhost/api/auth/login");
    const res = await POST(req);

    expect(profileSelectionResponseMock).toHaveBeenCalledWith("/auth/login", req);
    expect(res).toBe(sentinel);
  });
});

describe("POST /api/auth/profiles/select", () => {
  it("delegates to selectProfileSession with the request", async () => {
    const sentinel = new Response("select");
    selectProfileSessionMock.mockResolvedValue(sentinel as never);

    const { POST } = await import("./profiles/select/route");
    const req = makeRequest("http://localhost/api/auth/profiles/select");
    const res = await POST(req);

    expect(selectProfileSessionMock).toHaveBeenCalledWith(req);
    expect(res).toBe(sentinel);
  });
});

describe("POST /api/auth/switch-branch", () => {
  it("delegates to switchBranchSession with the request", async () => {
    const sentinel = new Response("switch");
    switchBranchSessionMock.mockResolvedValue(sentinel as never);

    const { POST } = await import("./switch-branch/route");
    const req = makeRequest("http://localhost/api/auth/switch-branch");
    const res = await POST(req);

    expect(switchBranchSessionMock).toHaveBeenCalledWith(req);
    expect(res).toBe(sentinel);
  });
});
