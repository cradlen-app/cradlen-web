import { NextResponse, type NextRequest } from "next/server";
import {
  backendFetch,
  readBackendJson,
} from "@/infrastructure/auth-transport/backend";
import {
  clearPatientAuthCookies,
  getValidPatientAccessToken,
  setPatientAuthCookies,
} from "@/infrastructure/auth-transport/patient-auth";

/**
 * Patient-scoped medications proxy. Injects the patient access token (rotating
 * it via the refresh cookie when needed) and forwards the optional `patient_id`
 * query to `GET /v1/patient-portal/medications`. Mirrors
 * `app/api/patient-auth/me/route.ts`.
 */
export async function GET(request: NextRequest) {
  const { accessToken, refreshedTokens } = await getValidPatientAccessToken();

  if (!accessToken) {
    const response = NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
    clearPatientAuthCookies(response);
    return response;
  }

  const search = request.nextUrl.search; // includes the leading "?" or ""
  const backendResponse = await backendFetch(
    `/patient-portal/medications${search}`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  const body = await readBackendJson(backendResponse);

  const response = NextResponse.json(body, { status: backendResponse.status });

  if (refreshedTokens) {
    setPatientAuthCookies(response, refreshedTokens);
  }
  if (backendResponse.status === 401) {
    clearPatientAuthCookies(response);
  }

  return response;
}
