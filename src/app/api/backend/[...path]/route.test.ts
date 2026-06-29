import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/infrastructure/auth-transport/backend", () => ({
  proxyAuthenticatedRequest: vi.fn(),
}));

import { proxyAuthenticatedRequest } from "@/infrastructure/auth-transport/backend";
import { GET, POST, PUT, PATCH, DELETE } from "./route";

const proxyMock = vi.mocked(proxyAuthenticatedRequest);

function ctx(path: string[] | undefined) {
  return { params: Promise.resolve({ path }) };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("catch-all backend proxy", () => {
  it("joins the path segments and appends the query string", async () => {
    const sentinel = new Response("ok");
    proxyMock.mockResolvedValue(sentinel as never);

    const req = new NextRequest("http://localhost/api/backend/organizations/123?include=branches");
    const res = await GET(req, ctx(["organizations", "123"]));

    expect(proxyMock).toHaveBeenCalledWith(req, "/organizations/123?include=branches");
    expect(res).toBe(sentinel);
  });

  it("defaults to the root path when no segments are present", async () => {
    proxyMock.mockResolvedValue(new Response("root") as never);

    const req = new NextRequest("http://localhost/api/backend");
    await GET(req, ctx(undefined));

    expect(proxyMock).toHaveBeenCalledWith(req, "/");
  });

  it("forwards every HTTP verb through the same handler", async () => {
    proxyMock.mockResolvedValue(new Response("ok") as never);

    const verbs: Array<[string, (req: NextRequest, c: ReturnType<typeof ctx>) => Promise<Response>]> = [
      ["POST", POST],
      ["PUT", PUT],
      ["PATCH", PATCH],
      ["DELETE", DELETE],
    ];

    for (const [method, handler] of verbs) {
      proxyMock.mockClear();
      const req = new NextRequest("http://localhost/api/backend/patients", { method });
      await handler(req, ctx(["patients"]));
      expect(proxyMock).toHaveBeenCalledWith(req, "/patients");
    }
  });

  it("exposes the same handler reference for all verbs", () => {
    expect(POST).toBe(GET);
    expect(PUT).toBe(GET);
    expect(PATCH).toBe(GET);
    expect(DELETE).toBe(GET);
  });
});
