import { proxySessionEndpoint } from "@/lib/server/backend";

export function POST(request: Request) {
  return proxySessionEndpoint("/auth/reset-password", request);
}
