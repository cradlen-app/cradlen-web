import { backendFetch, readBackendJson } from "@/lib/server/backend";
import {
  getSignupTokenFromRequest,
  persistSignupTokenFromBody,
  sanitizeSignupTokenResponse,
} from "@/lib/server/signup-session";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const signupToken = await getSignupTokenFromRequest(body);

  if (!signupToken) {
    return NextResponse.json(
      { message: "Session expired. Please request a new code." },
      { status: 401 },
    );
  }

  const payload = {
    signup_token: signupToken,
    code: body.code,
  };
  const response = await backendFetch("/auth/signup/verify", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const responseBody = await readBackendJson(response);

  if (!response.ok) {
    return NextResponse.json(responseBody ?? { message: response.statusText }, {
      status: response.status,
    });
  }

  const frontendResponse = NextResponse.json(
    sanitizeSignupTokenResponse(responseBody) ?? {},
    { status: response.status },
  );
  persistSignupTokenFromBody(frontendResponse, responseBody);

  return frontendResponse;
}
