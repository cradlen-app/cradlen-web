import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/infrastructure/auth-transport/backend", () => ({
  backendFetch: vi.fn(),
  readBackendJson: vi.fn(),
}));

import {
  backendFetch,
  readBackendJson,
} from "@/infrastructure/auth-transport/backend";
import { GET } from "./route";

const backendFetchMock = vi.mocked(backendFetch);
const readBackendJsonMock = vi.mocked(readBackendJson);

function makeRequest(headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/specialties/lookup", { headers });
}

beforeEach(() => {
  vi.clearAllMocks();
  backendFetchMock.mockResolvedValue({ ok: true, status: 200, statusText: "OK" } as Response);
});

describe("GET /api/specialties/lookup", () => {
  it("forwards the Accept-Language header when present", async () => {
    readBackendJsonMock.mockResolvedValue({ data: [{ code: "OBGYN" }] });

    const res = await GET(makeRequest({ "accept-language": "ar" }));

    expect(backendFetchMock).toHaveBeenCalledWith("/specialties/lookup", {
      headers: { "Accept-Language": "ar" },
    });
    expect(res.status).toBe(200);
    const json = (await res.json()) as { data: Array<{ code: string }> };
    expect(json.data[0].code).toBe("OBGYN");
  });

  it("sends no language header when the request omits one", async () => {
    readBackendJsonMock.mockResolvedValue({ data: [] });

    await GET(makeRequest());

    expect(backendFetchMock).toHaveBeenCalledWith("/specialties/lookup", {
      headers: {},
    });
  });

  it("falls back to the status text when the backend body is empty", async () => {
    backendFetchMock.mockResolvedValue({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
    } as Response);
    readBackendJsonMock.mockResolvedValue(null);

    const res = await GET(makeRequest());

    expect(res.status).toBe(503);
    const json = (await res.json()) as { message: string };
    expect(json.message).toBe("Service Unavailable");
  });
});
