import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { backendFetch, clearAuthCookies } from "@/lib/server/backend";
import {
  AUTH_REFRESH_TOKEN_COOKIE,
  AUTH_TOKEN_COOKIE,
} from "@/features/auth/lib/auth.constants";

export async function POST() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;
  const refreshToken = cookieStore.get(AUTH_REFRESH_TOKEN_COOKIE)?.value;

  if (refreshToken) {
    await backendFetch("/auth/logout", {
      method: "POST",
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      body: JSON.stringify({ refresh_token: refreshToken }),
    }).catch(() => null);
  }

  const response = NextResponse.json({ data: { authenticated: false }, meta: {} });
  clearAuthCookies(response);
  return response;
}
