import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/infrastructure/auth-transport/backend", () => ({
  backendFetch: vi.fn(),
  extractTokens: vi.fn(),
  readBackendJson: vi.fn(),
  sessionResponse: vi.fn(),
  setSelectionTokenCookie: vi.fn(),
}));
vi.mock("@/infrastructure/auth-transport/multi-tenant-auth", () => ({
  extractSelectionToken: vi.fn(),
  sanitizeProfileSelection: vi.fn(),
}));

import {
  backendFetch,
  extractTokens,
  readBackendJson,
  sessionResponse,
  setSelectionTokenCookie,
} from "@/infrastructure/auth-transport/backend";
import {
  extractSelectionToken,
  sanitizeProfileSelection,
} from "@/infrastructure/auth-transport/multi-tenant-auth";

const backendFetchMock = vi.mocked(backendFetch);
const extractTokensMock = vi.mocked(extractTokens);
const readBackendJsonMock = vi.mocked(readBackendJson);
const sessionResponseMock = vi.mocked(sessionResponse);
const setSelectionTokenCookieMock = vi.mocked(setSelectionTokenCookie);
const extractSelectionTokenMock = vi.mocked(extractSelectionToken);
const sanitizeProfileSelectionMock = vi.mocked(sanitizeProfileSelection);

function makeRequest(url: string, init?: RequestInit) {
  return new Request(url, { method: "POST", body: JSON.stringify({}), ...init });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/staff/invite/accept", () => {
  async function callAccept() {
    const { POST } = await import("./accept/route");
    return POST(makeRequest("http://localhost/api/staff/invite/accept"));
  }

  it("forwards backend errors with their status", async () => {
    backendFetchMock.mockResolvedValue({
      ok: false,
      status: 410,
      statusText: "Gone",
    } as Response);
    readBackendJsonMock.mockResolvedValue({ error: { code: "EXPIRED" } });

    const res = await callAccept();

    expect(res.status).toBe(410);
    const json = (await res.json()) as { error: { code: string } };
    expect(json.error.code).toBe("EXPIRED");
  });

  it("issues a full session for a single-organization user", async () => {
    backendFetchMock.mockResolvedValue({ ok: true, status: 200 } as Response);
    readBackendJsonMock.mockResolvedValue({ access_token: "a", refresh_token: "r" });
    const tokens = {
      access_token: "a",
      refresh_token: "r",
      token_type: "Bearer",
      expires_in: 900,
    };
    extractTokensMock.mockReturnValue(tokens);
    const sentinel = new Response("session");
    sessionResponseMock.mockReturnValue(sentinel as never);

    const res = await callAccept();

    expect(sessionResponseMock).toHaveBeenCalledWith(
      { data: { authenticated: true }, meta: {} },
      tokens,
      200,
    );
    expect(res).toBe(sentinel);
  });

  it("returns a sanitized profile selection with a selection cookie", async () => {
    backendFetchMock.mockResolvedValue({ ok: true, status: 200 } as Response);
    readBackendJsonMock.mockResolvedValue({ profiles: ["raw"] });
    extractTokensMock.mockReturnValue(null);
    extractSelectionTokenMock.mockReturnValue("sel-1");
    sanitizeProfileSelectionMock.mockReturnValue({
      data: { profiles: ["clean"] },
      meta: {},
    });

    const res = await callAccept();

    expect(res.status).toBe(200);
    const json = (await res.json()) as { data: { profiles: string[] } };
    expect(json.data.profiles).toEqual(["clean"]);
    expect(setSelectionTokenCookieMock).toHaveBeenCalledWith(expect.anything(), "sel-1");
    expect(sessionResponseMock).not.toHaveBeenCalled();
  });

  it("omits the selection cookie when no selection token is present", async () => {
    backendFetchMock.mockResolvedValue({ ok: true, status: 200 } as Response);
    readBackendJsonMock.mockResolvedValue({ profiles: [] });
    extractTokensMock.mockReturnValue(null);
    extractSelectionTokenMock.mockReturnValue(null);
    sanitizeProfileSelectionMock.mockReturnValue({
      data: { profiles: [] },
      meta: {},
    });

    await callAccept();

    expect(setSelectionTokenCookieMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/staff/invite/decline", () => {
  async function callDecline() {
    const { POST } = await import("./decline/route");
    return POST(makeRequest("http://localhost/api/staff/invite/decline"));
  }

  it("passes the backend response through with its status", async () => {
    backendFetchMock.mockResolvedValue({ ok: true, status: 200 } as Response);
    readBackendJsonMock.mockResolvedValue({ data: { declined: true } });

    const res = await callDecline();

    expect(backendFetchMock).toHaveBeenCalledWith(
      "/invitations/decline",
      expect.objectContaining({ method: "POST" }),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { data: { declined: boolean } };
    expect(json.data.declined).toBe(true);
  });

  it("falls back to the status text when the body is empty", async () => {
    backendFetchMock.mockResolvedValue({
      ok: false,
      status: 409,
      statusText: "Conflict",
    } as Response);
    readBackendJsonMock.mockResolvedValue(null);

    const res = await callDecline();

    expect(res.status).toBe(409);
    const json = (await res.json()) as { message: string };
    expect(json.message).toBe("Conflict");
  });
});

describe("GET /api/staff/invite/preview", () => {
  async function callPreview(url: string) {
    const { GET } = await import("./preview/route");
    return GET(new Request(url));
  }

  it("encodes the invitation id and token into the backend query", async () => {
    backendFetchMock.mockResolvedValue({ ok: true, status: 200 } as Response);
    readBackendJsonMock.mockResolvedValue({ data: { org: "Acme" } });

    const res = await callPreview(
      "http://localhost/api/staff/invite/preview?invitation_id=inv 1&token=t/k",
    );

    expect(backendFetchMock).toHaveBeenCalledWith(
      "/invitations/preview?invitation_id=inv%201&token=t%2Fk",
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { data: { org: string } };
    expect(json.data.org).toBe("Acme");
  });

  it("defaults missing params to empty strings", async () => {
    backendFetchMock.mockResolvedValue({ ok: true, status: 200 } as Response);
    readBackendJsonMock.mockResolvedValue({ data: {} });

    await callPreview("http://localhost/api/staff/invite/preview");

    expect(backendFetchMock).toHaveBeenCalledWith(
      "/invitations/preview?invitation_id=&token=",
    );
  });
});
