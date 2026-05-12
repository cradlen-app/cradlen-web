import { NextResponse } from "next/server";
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

export async function POST(request: Request) {
  const requestBody = await request.arrayBuffer();
  const response = await backendFetch("/invitations/accept", {
    method: "POST",
    body: requestBody,
  });
  const body = await readBackendJson(response);

  if (!response.ok) {
    return NextResponse.json(body ?? { message: response.statusText }, {
      status: response.status,
    });
  }

  // Single-organization user: backend returns auth tokens directly
  const tokens = extractTokens(body);
  if (tokens) {
    return sessionResponse(
      { data: { authenticated: true }, meta: {} },
      tokens,
      response.status,
    );
  }

  // Multi-organization user: backend returns a selection token + profiles
  const selectionToken = extractSelectionToken(body);
  const frontendResponse = NextResponse.json(sanitizeProfileSelection(body), {
    status: response.status,
  });
  if (selectionToken) {
    setSelectionTokenCookie(frontendResponse, selectionToken);
  }
  return frontendResponse;
}
