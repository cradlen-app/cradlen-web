import { type NextRequest } from "next/server";
import { proxyAuthenticatedRequest } from "@/infrastructure/auth-transport/backend";

export function GET(request: NextRequest) {
  return proxyAuthenticatedRequest(request, "/auth/me");
}
