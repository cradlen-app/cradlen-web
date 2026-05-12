import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  AUTH_REFRESH_TOKEN_COOKIE,
} from "@/features/auth/lib/auth.constants";
import {
  backendFetch,
  clearAuthCookies,
  extractTokens,
  readBackendJson,
  sessionResponse,
} from "@/infrastructure/auth-transport/backend";

export async function POST() {
  const refreshToken = (await cookies()).get(AUTH_REFRESH_TOKEN_COOKIE)?.value;

  if (!refreshToken) {
    const response = NextResponse.json(
      { message: "Missing refresh token" },
      { status: 401 },
    );
    clearAuthCookies(response);
    return response;
  }

  const backendResponse = await backendFetch("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  const body = await readBackendJson(backendResponse);

  if (!backendResponse.ok) {
    const response = NextResponse.json(body ?? { message: "Refresh failed" }, {
      status: backendResponse.status,
    });
    clearAuthCookies(response);
    return response;
  }

  const tokens = extractTokens(body);
  return sessionResponse({ data: { authenticated: true }, meta: {} }, tokens);
}
