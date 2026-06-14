import { cookies } from "next/headers";
import {
  API_BASE_URL,
  isExpiredJwt,
} from "@/infrastructure/auth-transport/backend";
import type { CurrentUser } from "@/common/types/user.types";
import type { ApiResponse } from "@/common/types/api.types";
import { AUTH_TOKEN_COOKIE } from "@/features/auth/lib/auth.constants";

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;

    // A Server Component cannot persist rotated cookies, so it must never call
    // the rotating /auth/refresh here (doing so revokes the browser's refresh
    // token and discards the replacement, leaving the browser holding a dead
    // token). If the access token is missing or expired, defer to the client:
    // useCurrentUser -> /api/auth/me refreshes through a route handler that
    // writes the new cookies back.
    if (!accessToken || isExpiredJwt(accessToken)) return null;

    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      next: { revalidate: 0 },
    });

    if (!res.ok) return null;

    const body = (await res.json()) as ApiResponse<CurrentUser>;
    return body.data ?? null;
  } catch {
    return null;
  }
}
