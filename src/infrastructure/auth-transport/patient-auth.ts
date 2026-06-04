import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  AUTH_REFRESH_TOKEN_MAX_AGE,
  PATIENT_AUTH_REFRESH_TOKEN_COOKIE,
  PATIENT_AUTH_TOKEN_COOKIE,
  PATIENT_SIGNUP_TOKEN_COOKIE,
  PATIENT_SIGNUP_TOKEN_MAX_AGE,
} from "@/features/auth/lib/auth.constants";
import type { AuthTokens } from "@/features/auth/types/sign-in.types";
import {
  backendFetch,
  extractTokens,
  isExpiredJwt,
  readBackendJson,
} from "./backend";

const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

// --- Cookie writers / clearers -------------------------------------------------

export function setPatientAuthCookies(response: NextResponse, tokens: AuthTokens) {
  response.cookies.set(PATIENT_AUTH_TOKEN_COOKIE, tokens.access_token, {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: Math.max(0, tokens.expires_in),
  });
  response.cookies.set(PATIENT_AUTH_REFRESH_TOKEN_COOKIE, tokens.refresh_token, {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: AUTH_REFRESH_TOKEN_MAX_AGE,
  });
}

export function clearPatientAuthCookies(response: NextResponse) {
  response.cookies.set(PATIENT_AUTH_TOKEN_COOKIE, "", {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: 0,
  });
  response.cookies.set(PATIENT_AUTH_REFRESH_TOKEN_COOKIE, "", {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: 0,
  });
  clearPatientSignupTokenCookie(response);
}

export function setPatientSignupTokenCookie(
  response: NextResponse,
  token: string,
  maxAge = PATIENT_SIGNUP_TOKEN_MAX_AGE,
) {
  response.cookies.set(PATIENT_SIGNUP_TOKEN_COOKIE, token, {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: Math.max(0, maxAge),
  });
}

export function clearPatientSignupTokenCookie(response: NextResponse) {
  response.cookies.set(PATIENT_SIGNUP_TOKEN_COOKIE, "", {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: 0,
  });
}

export async function getPatientSignupTokenFromRequest(
  body?: Record<string, unknown>,
) {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(PATIENT_SIGNUP_TOKEN_COOKIE)?.value;
  const bodyToken = body?.patient_signup_token;
  const requestToken =
    typeof bodyToken === "string" && bodyToken.trim() ? bodyToken : null;

  return requestToken ?? cookieToken ?? null;
}

// --- Refresh -------------------------------------------------------------------

const inflightRefreshes = new Map<string, Promise<AuthTokens>>();

async function performPatientRefresh(refreshToken: string): Promise<AuthTokens> {
  const response = await backendFetch("/patient-auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  const body = await readBackendJson(response);
  const tokens = response.ok ? extractTokens(body) : null;

  if (!tokens) {
    throw new Error("Patient token refresh failed");
  }

  return tokens;
}

function refreshPatientTokens(refreshToken: string) {
  const existing = inflightRefreshes.get(refreshToken);
  if (existing) return existing;

  const promise = performPatientRefresh(refreshToken).finally(() => {
    inflightRefreshes.delete(refreshToken);
  });
  inflightRefreshes.set(refreshToken, promise);
  return promise;
}

/**
 * Returns a usable patient access token, transparently rotating an expired one
 * via the refresh cookie. `refreshedTokens` is non-null when a rotation happened
 * and the caller should re-persist the new pair onto its response.
 */
export async function getValidPatientAccessToken(): Promise<{
  accessToken: string | null;
  refreshedTokens: AuthTokens | null;
}> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(PATIENT_AUTH_TOKEN_COOKIE)?.value;
  const refreshToken = cookieStore.get(PATIENT_AUTH_REFRESH_TOKEN_COOKIE)?.value;

  if (accessToken && !isExpiredJwt(accessToken)) {
    return { accessToken, refreshedTokens: null };
  }

  if (!refreshToken) {
    return { accessToken: null, refreshedTokens: null };
  }

  try {
    const refreshedTokens = await refreshPatientTokens(refreshToken);
    return { accessToken: refreshedTokens.access_token, refreshedTokens };
  } catch {
    return { accessToken: null, refreshedTokens: null };
  }
}

// --- Token-issuing response helpers -------------------------------------------

function passthroughError(body: unknown, response: Response) {
  return NextResponse.json(body ?? { message: response.statusText }, {
    status: response.status,
  });
}

const AUTHENTICATED = { data: { authenticated: true }, meta: {} };

export async function patientLoginResponse(request: Request) {
  const response = await backendFetch("/patient-auth/login", {
    method: "POST",
    body: await request.arrayBuffer(),
  });
  const body = await readBackendJson(response);

  if (!response.ok) return passthroughError(body, response);

  const tokens = extractTokens(body);
  if (!tokens) return passthroughError(body, response);

  const frontendResponse = NextResponse.json(AUTHENTICATED, { status: 200 });
  setPatientAuthCookies(frontendResponse, tokens);
  return frontendResponse;
}

export async function patientSignupStartResponse(request: Request) {
  const response = await backendFetch("/patient-auth/signup/start", {
    method: "POST",
    body: await request.arrayBuffer(),
  });
  const body = await readBackendJson(response);

  if (!response.ok) return passthroughError(body, response);

  const root =
    body && typeof body === "object"
      ? (body as Record<string, unknown>)
      : null;
  const data =
    root?.data && typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : null;
  const token = data?.patient_signup_token;
  const expiresIn =
    typeof data?.expires_in === "number" ? data.expires_in : undefined;

  const frontendResponse = NextResponse.json(
    { data: { expires_in: expiresIn ?? null }, meta: {} },
    { status: 200 },
  );

  if (typeof token === "string" && token.trim()) {
    setPatientSignupTokenCookie(frontendResponse, token, expiresIn);
  }

  return frontendResponse;
}

export async function patientSignupCompleteResponse(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  const signupToken = await getPatientSignupTokenFromRequest(body);

  if (!signupToken) {
    return NextResponse.json(
      { message: "Your sign-up session expired. Please start again." },
      { status: 401 },
    );
  }

  const payload = {
    patient_signup_token: signupToken,
    password: body.password,
    confirm_password: body.confirm_password,
  };
  const response = await backendFetch("/patient-auth/signup/complete", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const responseBody = await readBackendJson(response);

  if (!response.ok) return passthroughError(responseBody, response);

  const tokens = extractTokens(responseBody);
  if (!tokens) return passthroughError(responseBody, response);

  const frontendResponse = NextResponse.json(AUTHENTICATED, { status: 201 });
  setPatientAuthCookies(frontendResponse, tokens);
  clearPatientSignupTokenCookie(frontendResponse);
  return frontendResponse;
}
