import { useAuthStore } from "@/features/auth/store/authStore";
import { useUserStore } from "@/features/auth/store/userStore";
import { routing } from "@/i18n/routing";
import { queryClient } from "@/lib/queryClient";

const BASE_URL = "https://api.cradlen.com/v1";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body?.message ?? res.statusText);
  }
  return res.json() as Promise<T>;
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
  const token = useAuthStore.getState().tokens?.access_token;
  return apiFetch<T>(path, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  }).catch((error) => {
    if (error instanceof ApiError && error.status === 401) {
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

    throw error;
  });
}
