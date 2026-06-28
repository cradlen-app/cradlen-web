import { ApiError } from "@/common/errors/api-error";
import { useAuthStore } from "@/features/auth/store/authStore";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";
import { useUserStore } from "@/features/auth/store/userStore";
import { routing } from "@/i18n/routing";
import { queryClient } from "@/infrastructure/query/queryClient";

// Re-exported for the many existing `@/infrastructure/http/api` importers; the
// class itself now lives in `common/` so pure helpers can narrow on it without
// `common/` depending on `infrastructure/`.
export { ApiError };

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
  "/staff/invite/decline": "/api/staff/invite/decline",
  "/auth/switch-branch": "/api/auth/switch-branch",
};

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

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function extractApiErrorMessage(body: unknown, fallback: string): string | string[] {
  if (!body || typeof body !== "object") return fallback;

  const b = body as Record<string, unknown>;

  // Single string message, or NestJS ValidationPipe's `message: string[]` — keep
  // every entry so field-level validation errors reach the user instead of a
  // generic status text.
  if (typeof b.message === "string") return b.message;
  if (isStringArray(b.message)) return b.message;

  // Nested { error: { message } }, string or string[]
  const nestedError = b.error as Record<string, unknown> | undefined;
  if (nestedError) {
    if (typeof nestedError.message === "string") return nestedError.message;
    if (isStringArray(nestedError.message)) return nestedError.message;
  }

  // Array of validation errors: { errors: [{ message }] }
  if (Array.isArray(b.errors) && b.errors.length > 0) {
    const first = b.errors[0];
    if (first && typeof (first as Record<string, unknown>).message === "string") {
      return (first as Record<string, unknown>).message as string;
    }
  }

  // { detail: "..." } (common in some backends)
  if (typeof b.detail === "string") return b.detail;

  return fallback;
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
  // Forward the active UI locale so the backend can localize responses
  // (e.g. form-template labels). The proxy copies request headers through.
  const acceptLanguage =
    typeof window !== "undefined"
      ? getClientLocale(window.location.pathname)
      : routing.defaultLocale;
  const headers = {
    "Accept-Language": acceptLanguage,
    ...(organizationId ? { "X-Organization-Id": organizationId } : {}),
    ...(profileId ? { "X-Profile-Id": profileId } : {}),
    ...(branchId ? { "X-Branch-Id": branchId } : {}),
    ...options?.headers,
  };

  return apiFetch<T>(`/api/backend${path}`, { ...options, headers }).catch((error) => {
    if (error instanceof ApiError && error.status === 401) {
      // Don't tear down the session on a single 401 — it's often a transient
      // race-loser while the proxy is silently refreshing the token. Verify the
      // session is actually dead before logging out. (Fire-and-forget: the
      // original error still propagates so React Query can retry.)
      void handleUnauthorized();
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

// Routes that don't need an authenticated user. A 401 from these pages
// must NOT trigger a sign-in redirect, otherwise the redirectTo param
// gets re-encoded each cycle and the URL grows unbounded.
const PUBLIC_AUTH_PATH_PREFIXES = [
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/invitations/accept",
];

function isPublicAuthPath(pathWithoutLocale: string) {
  // The marketing landing page lives at the locale root ("/"). Anonymous
  // visitors get an expected 401 from the global `/auth/me` probe there, so it
  // must stay put — authenticated staff are sent to their dashboard separately
  // by `RedirectIfAuthenticated`, not by this teardown path.
  if (pathWithoutLocale === "/") return true;

  return PUBLIC_AUTH_PATH_PREFIXES.some(
    (p) => pathWithoutLocale === p || pathWithoutLocale.startsWith(p + "/"),
  );
}

// A burst of authenticated calls can all 401 at once (e.g. the dashboard's
// query fan-out after the access token expired). Without a guard each failure
// clears the stores and calls window.location.assign, and every repeated assign
// restarts the still-pending /sign-in navigation — so it never settles while
// more calls keep firing, producing a request/error storm. Make the teardown +
// redirect single-flight: the first 401 wins, the rest no-op. The flag is never
// reset because the hard navigation tears down this module anyway.
let isRedirectingToSignIn = false;

// Single-flight guard so a burst of simultaneous 401s (the dashboard's query
// fan-out after the access token expires) triggers exactly one /auth/me probe,
// not one per failed request.
let isVerifyingSession = false;

// A 401 from an authenticated call is NOT proof the session is gone: after the
// access token expires the proxy refreshes it on the next call, and the loser of
// a refresh-rotation race can come back 401 while the session is perfectly
// recoverable. So before logging out, probe /auth/me once — it runs through the
// proxy, which performs the reactive refresh and rotates fresh cookies as a side
// effect. Only a genuinely dead session (probe also 401s) logs the user out.
// This makes the dashboard behave like the landing page, which already checks
// /auth/me before treating the user as anonymous.
async function handleUnauthorized() {
  if (isRedirectingToSignIn || isVerifyingSession) return;

  // Public auth pages legitimately have no session — never redirect from them.
  const pathWithoutLocale =
    typeof window !== "undefined"
      ? getPathWithoutLocale(window.location.pathname)
      : null;
  if (pathWithoutLocale !== null && isPublicAuthPath(pathWithoutLocale)) return;

  isVerifyingSession = true;
  let sessionAlive = false;
  try {
    // Plain fetch (NOT apiAuthFetch) so a probe 401 doesn't recurse back here.
    const res = await fetch("/api/auth/me", {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    // Treat a 200 as alive; treat a network error (caught below) as "don't know"
    // and fail safe by NOT logging out.
    sessionAlive = res.ok || res.status !== 401;
  } catch {
    // Couldn't reach the proxy — don't wipe a possibly-valid session over a blip.
    sessionAlive = true;
  } finally {
    isVerifyingSession = false;
  }

  if (!sessionAlive) clearSessionAndRedirect();
}

function clearSessionAndRedirect() {
  if (isRedirectingToSignIn) return;

  // Public auth pages (sign-in, invitation accept, patient portal, …)
  // legitimately have no session: an anonymous 401 — e.g. the `/auth/me` probe
  // that `useCurrentUser` fires on every page — is expected there. Bail out
  // before touching any shared state. Clearing the query cache here would wipe
  // unrelated in-flight queries on the same page (notably the invitation
  // preview), so its result is delivered to a detached query and the page stays
  // stuck on its loading skeleton.
  const pathWithoutLocale =
    typeof window !== "undefined"
      ? getPathWithoutLocale(window.location.pathname)
      : null;
  if (pathWithoutLocale !== null && isPublicAuthPath(pathWithoutLocale)) return;

  useAuthStore.getState().clearSession();
  useAuthContextStore.getState().clearContext();
  useUserStore.getState().clearUser();
  queryClient.clear();

  if (pathWithoutLocale !== null) {
    isRedirectingToSignIn = true;

    const locale = getClientLocale(window.location.pathname);
    const pathWithSearch = `${pathWithoutLocale}${window.location.search}`;
    const redirectTo =
      pathWithSearch && pathWithSearch !== "/"
        ? `?redirectTo=${encodeURIComponent(pathWithSearch)}`
        : "";
    window.location.assign(`/${locale}/sign-in${redirectTo}`);
  }
}
