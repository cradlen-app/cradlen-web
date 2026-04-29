import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_SELECTION_TOKEN_COOKIE, AUTH_TOKEN_COOKIE } from "@/features/auth/lib/auth.constants";
import {
  backendFetch,
  clearSelectionTokenCookie,
  extractTokens,
  readBackendJson,
  sessionResponse,
  setSelectionTokenCookie,
} from "./backend";

function getObject(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

export function extractSelectionToken(body: unknown) {
  const root = getObject(body);
  const data = getObject(root?.data);
  const source = data ?? root;
  const token = source?.selection_token;
  return typeof token === "string" ? token : null;
}

export function sanitizeProfileSelection(body: unknown) {
  const root = getObject(body);
  const data = getObject(root?.data);
  const source = data ?? root;
  const meta = getObject(root?.meta) ?? {};

  if (source?.type === "ONBOARDING_REQUIRED") {
    return {
      data: {
        type: "ONBOARDING_REQUIRED",
        step: source.step,
      },
      meta,
    };
  }

  const profiles = source?.profiles;

  return {
    data: {
      profiles: Array.isArray(profiles) ? profiles : [],
    },
    meta,
  };
}

export async function profileSelectionResponse(
  backendPath: string,
  request: Request,
) {
  const requestBody = await request.arrayBuffer();
  const response = await backendFetch(backendPath, {
    method: "POST",
    body: requestBody,
  });
  const body = await readBackendJson(response);

  if (!response.ok) {
    return NextResponse.json(body ?? { message: response.statusText }, {
      status: response.status,
    });
  }

  const selectionToken = extractSelectionToken(body);
  const frontendResponse = NextResponse.json(sanitizeProfileSelection(body), {
    status: response.status,
  });

  if (selectionToken) {
    setSelectionTokenCookie(frontendResponse, selectionToken);
  }

  return frontendResponse;
}

function getCookieValue(cookieHeader: string | null, name: string) {
  return cookieHeader
    ?.split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.split("=")[1];
}

export async function selectProfileSession(request: Request) {
  const cookieStore = await cookies();
  const selectionToken = cookieStore.get(AUTH_SELECTION_TOKEN_COOKIE)?.value;
  const accessToken = getCookieValue(request.headers.get("cookie"), AUTH_TOKEN_COOKIE);
  const body = (await request.json()) as Record<string, unknown>;
  const payload = {
    ...body,
    ...(selectionToken ? { selection_token: selectionToken } : {}),
  };
  const headers: HeadersInit = {};

  if (accessToken) {
    headers.Authorization = `Bearer ${decodeURIComponent(accessToken)}`;
  }

  const response = await backendFetch("/auth/profiles/select", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  const responseBody = await readBackendJson(response);

  if (!response.ok) {
    return NextResponse.json(responseBody ?? { message: response.statusText }, {
      status: response.status,
    });
  }

  const tokens = extractTokens(responseBody);
  const data = getObject(getObject(responseBody)?.data) ?? {};
  const frontendResponse = sessionResponse(
    {
      data: {
        authenticated: true,
        account_id: data.account_id ?? body.account_id ?? null,
        branch_id: body.branch_id ?? data.branch_id ?? null,
        profile_id: data.profile_id ?? body.profile_id ?? null,
      },
      meta: getObject(getObject(responseBody)?.meta) ?? {},
    },
    tokens,
    response.status,
  );

  clearSelectionTokenCookie(frontendResponse);
  return frontendResponse;
}
