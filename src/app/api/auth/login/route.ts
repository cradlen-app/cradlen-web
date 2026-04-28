import { proxySessionEndpoint } from "@/lib/server/backend";

export function POST(request: Request) {
  return proxySessionEndpoint("/auth/login", request, (body) => {
    const data =
      body && typeof body === "object" && "data" in body
        ? (body as { data?: unknown }).data
        : null;

    if (data && typeof data === "object" && "pending_step" in data) {
      return body;
    }

    return { data: { authenticated: true }, meta: {} };
  });
}
