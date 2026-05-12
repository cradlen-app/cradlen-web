import { proxySessionEndpoint } from "@/infrastructure/auth-transport/backend";

export function POST(request: Request) {
  return proxySessionEndpoint("/auth/register/organization", request);
}
