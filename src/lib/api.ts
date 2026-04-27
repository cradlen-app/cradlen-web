import { useAuthStore } from "@/features/auth/store/authStore";
import { useUserStore } from "@/features/auth/store/userStore";
import type {
  AuthTokens,
  AuthTokensResponse,
} from "@/features/auth/types/sign-in.types";
import { routing } from "@/i18n/routing";
import { queryClient } from "@/lib/queryClient";

const BASE_URL = "https://api.cradlen.com/v1";

export class ApiError extends Error {
  messages: string[];

  constructor(
    public status: number,
    message: string | string[],
    public body?: unknown,
  ) {
    const messages = Array.isArray(message) ? message : [message];

    super(messages.join("\n"));
    this.messages = messages;
  }
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const { headers, ...restOptions } = options ?? {};
  const res = await fetch(`${BASE_URL}${path}`, {
    ...restOptions,
    headers: { "Content-Type": "application/json", ...headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      body && typeof body === "object" && "message" in body
        ? (body.message as string | string[])
        : res.statusText;

    throw new ApiError(res.status, message, body);
  }
  return res.json() as Promise<T>;
}

let refreshPromise: Promise<AuthTokens> | null = null;

function isExpiredJwt(token: string) {
  const [, payload] = token.split(".");
  if (!payload) return false;

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const decoded = JSON.parse(atob(padded)) as { exp?: number };

    return typeof decoded.exp === "number" && decoded.exp * 1000 <= Date.now();
  } catch {
    return false;
  }
}

function shouldRefreshAccessToken(tokens: AuthTokens | null) {
  if (!tokens?.refresh_token) return false;

  return !tokens.access_token || isExpiredJwt(tokens.access_token);
}

function refreshAuthTokens() {
  const refreshToken = useAuthStore.getState().tokens?.refresh_token;
  if (!refreshToken) return Promise.reject(new Error("Missing refresh token"));

  refreshPromise ??= apiFetch<AuthTokensResponse>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
    .then((response) => response.data)
    .then((tokens) => {
      useAuthStore.getState().setTokens(tokens);
      return tokens;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

function getClientLocale(pathname: string) {
  const maybeLocale = pathname.split("/")[1];
  return routing.locales.includes(maybeLocale as (typeof routing.locales)[number])
    ? maybeLocale
    : routing.defaultLocale;
}

function getPathWithoutLocale(pathname: string) {
  const segments = pathname.split("/");
  const maybeLocale = segments[1];

  if (routing.locales.includes(maybeLocale as (typeof routing.locales)[number])) {
    const path = `/${segments.slice(2).join("/")}`;
    return path === "/" ? "/" : path.replace(/\/$/, "");
  }

  return pathname === "/" ? "/" : pathname.replace(/\/$/, "");
}

export function apiAuthFetch<T>(path: string, options?: RequestInit): Promise<T> {
  return apiAuthFetchWithRefresh<T>(path, options);
}

function clearSessionAndRedirect() {
  useAuthStore.getState().clearTokens();
  useUserStore.getState().clearUser();
  queryClient.clear();

  if (typeof window !== "undefined") {
    const locale = getClientLocale(window.location.pathname);
    const pathWithSearch = `${getPathWithoutLocale(window.location.pathname)}${window.location.search}`;
    const redirectTo =
      pathWithSearch && pathWithSearch !== "/" ? `?redirectTo=${encodeURIComponent(pathWithSearch)}` : "";
    window.location.assign(`/${locale}/sign-in${redirectTo}`);
  }
}

async function apiAuthFetchWithRefresh<T>(
  path: string,
  options?: RequestInit,
  hasRetried = false,
): Promise<T> {
  const tokens = useAuthStore.getState().tokens;

  if (!hasRetried && shouldRefreshAccessToken(tokens)) {
    await refreshAuthTokens().catch((error) => {
      clearSessionAndRedirect();
      throw error;
    });
  }

  const token = useAuthStore.getState().tokens?.access_token;

  try {
    return await apiFetch<T>(path, {
      ...options,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      const refreshToken = useAuthStore.getState().tokens?.refresh_token;

      if (!hasRetried && refreshToken) {
        try {
          await refreshAuthTokens();
          return apiAuthFetchWithRefresh<T>(path, options, true);
        } catch {
          clearSessionAndRedirect();
        }
      }

      clearSessionAndRedirect();
    }

    throw error;
  }
}
