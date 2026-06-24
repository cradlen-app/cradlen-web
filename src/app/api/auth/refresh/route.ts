import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_REFRESH_TOKEN_COOKIE } from "@/features/auth/lib/auth.constants";
import {
  BackendError,
  clearAuthCookies,
  refreshAuthTokens,
  sessionResponse,
} from "@/infrastructure/auth-transport/backend";

export async function POST() {
  const refreshToken = (await cookies()).get(AUTH_REFRESH_TOKEN_COOKIE)?.value;

  if (!refreshToken) {
    // No refresh token at all = genuinely unauthenticated. The only case where
    // clearing cookies is safe (there is nothing to recover).
    const response = NextResponse.json(
      { message: "Missing refresh token" },
      { status: 401 },
    );
    clearAuthCookies(response);
    return response;
  }

  try {
    // Goes through the shared in-flight dedup (see refreshAuthTokens), so a
    // proactive refresh racing a reactive one collapses into one rotation.
    const tokens = await refreshAuthTokens(refreshToken);
    // Surface the non-sensitive expires_in so the client schedules its next
    // proactive refresh accurately; raw tokens stay HttpOnly-cookie only.
    return sessionResponse(
      {
        data: { authenticated: true, expires_in: tokens.expires_in },
        meta: {},
      },
      tokens,
    );
  } catch (error) {
    // Do NOT clear cookies on a failed refresh: a concurrent rotation may have
    // just set fresh ones, and a transient backend/network blip must not destroy
    // the recovery cookies (selection token). Mirror the reactive proxy's
    // "never wipe on a race" policy — the client verifies /auth/me before it
    // logs the user out, and explicit logout is the path that clears cookies.
    const status = error instanceof BackendError ? error.status : 401;
    return NextResponse.json({ message: "Refresh failed" }, { status });
  }
}
