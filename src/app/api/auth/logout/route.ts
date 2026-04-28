import { NextResponse } from "next/server";
import { backendFetch, clearAuthCookies } from "@/lib/server/backend";
import { AUTH_TOKEN_COOKIE } from "@/features/auth/lib/auth.constants";

export async function POST(request: Request) {
  const accessToken = request.headers
    .get("cookie")
    ?.split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${AUTH_TOKEN_COOKIE}=`))
    ?.split("=")[1];

  if (accessToken) {
    await backendFetch("/auth/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${decodeURIComponent(accessToken)}` },
    }).catch(() => null);
  }

  const response = NextResponse.json({ data: { authenticated: false }, meta: {} });
  clearAuthCookies(response);
  return response;
}
