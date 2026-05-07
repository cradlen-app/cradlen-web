import { cookies } from "next/headers";
import {
  API_BASE_URL,
  isExpiredJwt,
  backendFetch,
  extractTokens,
  readBackendJson,
} from "@/lib/server/backend";
import type { CurrentUser } from "@/types/user.types";
import type { ApiResponse } from "@/types/api.types";
import {
  AUTH_TOKEN_COOKIE,
  AUTH_REFRESH_TOKEN_COOKIE,
} from "@/features/auth/lib/auth.constants";

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const cookieStore = await cookies();
    let accessToken = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;
    const refreshToken = cookieStore.get(AUTH_REFRESH_TOKEN_COOKIE)?.value;

    if (!accessToken || isExpiredJwt(accessToken)) {
      if (!refreshToken) return null;

      const refreshRes = await backendFetch("/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!refreshRes.ok) return null;

      const refreshBody = await readBackendJson(refreshRes);
      const tokens = extractTokens(refreshBody);
      if (!tokens) return null;

      accessToken = tokens.access_token;
    }

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
