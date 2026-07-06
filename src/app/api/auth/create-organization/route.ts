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
  const selectionToken = cookieStore.get(AUTH_SELECTION_TOKEN_COOKIE)?.value;

  if (!accessToken && !selectionToken) {
    return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  }

  const body = await request.arrayBuffer();

  // Profile-less user (removed from all orgs) — only a selection token, no
  // session. Use the public bootstrap endpoint, which creates the org AND
  // returns a fresh profile_selection listing it, so the client can select the
  // new org and finish signing in. The authenticated POST /organizations below
  // would 401 on a non-access token.
  if (!accessToken) {
    const response = await backendFetch("/organizations/bootstrap", {
      method: "POST",
      headers: { Authorization: `Bearer ${selectionToken}` },
      body,
    });
    const responseBody = await readBackendJson(response);
    if (!response.ok) {
      return NextResponse.json(responseBody ?? { message: response.statusText }, {
        status: response.status,
      });
    }
    const newSelectionToken = extractSelectionToken(responseBody);
    const out = NextResponse.json(sanitizeProfileSelection(responseBody), {
      status: response.status,
    });
    if (newSelectionToken) {
      setSelectionTokenCookie(out, newSelectionToken);
    }
    return out;
  }

  const response = await backendFetch("/organizations", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
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
  const profilesRes = await backendFetch("/auth/profiles", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (profilesRes.ok) {
    const profilesBody = await readBackendJson(profilesRes);
    const selectionTokenValue = extractSelectionToken(profilesBody);
    const out = NextResponse.json(sanitizeProfileSelection(profilesBody), {
      status: response.status,
    });
    if (selectionTokenValue) {
      setSelectionTokenCookie(out, selectionTokenValue);
    }
    return out;
  }

  const responseBody = await readBackendJson(response);
  return NextResponse.json(responseBody ?? { message: response.statusText }, {
    status: response.status,
  });
}
