import { type NextRequest } from "next/server";
import { proxyAuthenticatedRequest } from "@/infrastructure/auth-transport/backend";

/**
 * Mints a short-lived Socket.IO handshake ticket. The proxy reads the httpOnly
 * access-token cookie server-side (refreshing if needed) and forwards it as a
 * Bearer token, so the real access token never reaches client JS. The browser
 * passes the returned `ws_ticket` in the socket handshake (`auth.token`).
 */
export function POST(request: NextRequest) {
  return proxyAuthenticatedRequest(request, "/auth/ws-ticket");
}
