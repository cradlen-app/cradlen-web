import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  AUTH_SELECTION_TOKEN_COOKIE,
  AUTH_TOKEN_COOKIE,
} from "@/features/auth/lib/auth.constants";
import {
  backendFetch,
  readBackendJson,
  setSelectionTokenCookie,
} from "@/infrastructure/auth-transport/backend";
import {
  extractSelectionToken,
  sanitizeProfileSelection,
} from "@/infrastructure/auth-transport/multi-tenant-auth";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;
  const bearer =
    accessToken ?? cookieStore.get(AUTH_SELECTION_TOKEN_COOKIE)?.value;

  if (!bearer) {
    return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  }

  const body = await request.arrayBuffer();
  const response = await backendFetch("/organizations", {
    method: "POST",
    headers: { Authorization: `Bearer ${bearer}` },
    body,
  });

  if (!response.ok) {
    const errorBody = await readBackendJson(response);
    return NextResponse.json(errorBody ?? { message: response.statusText }, {
      status: response.status,
    });
  }

  // Org created — refresh the user's selectable profiles so the new org shows
  // in the select-profile screen, and mint a fresh selection token cookie so it
  // can be selected. Requires the JWT access token (selection token can't list
  // profiles); fall back to the create response if it's unavailable.
  if (accessToken) {
    const profilesRes = await backendFetch("/auth/profiles", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (profilesRes.ok) {
      const profilesBody = await readBackendJson(profilesRes);
      const selectionToken = extractSelectionToken(profilesBody);
      const out = NextResponse.json(sanitizeProfileSelection(profilesBody), {
        status: response.status,
      });
      if (selectionToken) {
        setSelectionTokenCookie(out, selectionToken);
      }
      return out;
    }
  }

  const responseBody = await readBackendJson(response);
  return NextResponse.json(responseBody ?? { message: response.statusText }, {
    status: response.status,
  });
}
