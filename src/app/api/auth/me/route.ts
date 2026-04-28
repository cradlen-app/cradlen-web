import { type NextRequest } from "next/server";
import { proxyAuthenticatedRequest } from "@/lib/server/backend";

export function GET(request: NextRequest) {
  return proxyAuthenticatedRequest(request, "/auth/me");
}
