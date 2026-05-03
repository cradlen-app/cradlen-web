import { NextResponse } from "next/server";
import {
  backendFetch,
  extractTokens,
  readBackendJson,
  sessionResponse,
  setSelectionTokenCookie,
} from "@/lib/server/backend";
import {
  extractSelectionToken,
  sanitizeProfileSelection,
} from "@/lib/server/multi-tenant-auth";

export async function POST(request: Request) {
  const requestBody = await request.arrayBuffer();
  const response = await backendFetch("/staff/invite/accept", {
    method: "POST",
    body: requestBody,
  });
  const body = await readBackendJson(response);

  if (!response.ok) {
    return NextResponse.json(body ?? { message: response.statusText }, {
      status: response.status,
    });
  }

  // Single-account user: backend returns auth tokens directly
  const tokens = extractTokens(body);
  if (tokens) {
    return sessionResponse(
      { data: { authenticated: true }, meta: {} },
      tokens,
      response.status,
    );
  }

  // Multi-account user: backend returns a selection token + profiles
  const selectionToken = extractSelectionToken(body);
  const frontendResponse = NextResponse.json(sanitizeProfileSelection(body), {
    status: response.status,
  });
  if (selectionToken) {
    setSelectionTokenCookie(frontendResponse, selectionToken);
  }
  return frontendResponse;
}
