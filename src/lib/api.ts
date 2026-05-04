import { useAuthStore } from "@/features/auth/store/authStore";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { useUserStore } from "@/features/auth/store/userStore";
import { routing } from "@/i18n/routing";
import { queryClient } from "@/lib/queryClient";

const DEFAULT_API_BASE_URL = "https://api.cradlen.com/v1";

const SESSION_ENDPOINTS: Record<string, string> = {
  "/auth/login": "/api/auth/login",
  "/auth/profiles/select": "/api/auth/profiles/select",
  "/auth/signup/start": "/api/auth/signup/start",
  "/auth/signup/verify": "/api/auth/signup/verify",
  "/auth/signup/complete": "/api/auth/signup/complete",
  "/auth/signup/resend": "/api/auth/signup/resend",
  "/auth/forgot-password/start": "/api/auth/forgot-password/start",
  "/auth/forgot-password/verify": "/api/auth/forgot-password/verify",
  "/auth/forgot-password/resend": "/api/auth/forgot-password/resend",
  "/auth/forgot-password/reset": "/api/auth/forgot-password/reset",
  "/auth/registration/status": "/api/auth/registration/status",
  "/auth/register/organization": "/api/auth/register-organization",
  "/auth/reset-password": "/api/auth/reset-password",
  "/staff/invite/accept": "/api/staff/invite/accept",
  "/auth/switch-branch": "/api/auth/switch-branch",
};

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

function getPublicApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_BASE_URL;
}

function resolveApiUrl(path: string) {
  if (/^https?:\/\//.test(path)) return path;

  const [pathname, search = ""] = path.split("?");
  const localEndpoint = SESSION_ENDPOINTS[pathname];

  if (localEndpoint) {
    return `${localEndpoint}${search ? `?${search}` : ""}`;
  }

  if (path.startsWith("/api/")) {
    return path;
  }

  return `${getPublicApiBaseUrl()}${path}`;
}

async function parseResponseBody(res: Response) {
  if (res.status === 204) return undefined;

  const text = await res.text();
  if (!text) return undefined;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function extractApiErrorMessage(body: unknown, fallback: string) {
  if (!body || typeof body !== "object") return fallback;

  const root = body as {
    message?: unknown;
    error?: { message?: unknown } | unknown;
  };
  const nestedError =
    root.error && typeof root.error === "object"
      ? (root.error as { message?: unknown })
      : null;
  const message = root.message ?? nestedError?.message;

  if (Array.isArray(message) && message.every((item) => typeof item === "string")) {
    return message;
  }

  return typeof message === "string" ? message : fallback;
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const { headers, ...restOptions } = options ?? {};
  const url = resolveApiUrl(path);
  const res = await fetch(url, {
    ...restOptions,
    credentials: url.startsWith("/api/") ? "include" : restOptions.credentials,
    headers: { "Content-Type": "application/json", ...headers },
  });
  const body = await parseResponseBody(res);

  if (!res.ok) {
    throw new ApiError(
      res.status,
      extractApiErrorMessage(body, res.statusText),
      body,
    );
  }

  return body as T;
}

export function apiAuthFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const { organizationId, branchId, profileId } = useAuthContextStore.getState();
  const headers = {
    ...(organizationId ? { "X-Organization-Id": organizationId } : {}),
    ...(profileId ? { "X-Profile-Id": profileId } : {}),
    ...(branchId ? { "X-Branch-Id": branchId } : {}),
    ...options?.headers,
  };

  return apiFetch<T>(`/api/backend${path}`, { ...options, headers }).catch((error) => {
    if (error instanceof ApiError && error.status === 401) {
      clearSessionAndRedirect();
    }

    throw error;
  });
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

function clearSessionAndRedirect() {
  useAuthStore.getState().clearSession();
  useAuthContextStore.getState().clearContext();
  useUserStore.getState().clearUser();
  queryClient.clear();

  if (typeof window !== "undefined") {
    const locale = getClientLocale(window.location.pathname);
    const pathWithSearch = `${getPathWithoutLocale(window.location.pathname)}${window.location.search}`;
    const redirectTo =
      pathWithSearch && pathWithSearch !== "/"
        ? `?redirectTo=${encodeURIComponent(pathWithSearch)}`
        : "";
    window.location.assign(`/${locale}/sign-in${redirectTo}`);
  }
}
