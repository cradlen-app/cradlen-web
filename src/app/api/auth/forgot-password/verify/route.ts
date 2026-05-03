import { type NextRequest, NextResponse } from "next/server";
import {
  backendFetch,
  getResetTokenFromRequest,
  readBackendJson,
  setResetTokenCookie,
} from "@/lib/server/backend";
import { RESET_TOKEN_MAX_AGE } from "@/features/auth/lib/auth.constants";

export async function POST(request: NextRequest) {
  const resetToken = getResetTokenFromRequest(request);
  if (!resetToken) {
    return NextResponse.json(
      { error: { code: "SESSION_EXPIRED", message: "Reset session expired or not found", statusCode: 401 } },
      { status: 401 },
    );
  }

  const clientBody = await request.json() as { code?: string };
  const response = await backendFetch("/auth/verify-reset-code", {
    method: "POST",
    body: JSON.stringify({ reset_token: resetToken, code: clientBody.code }),
  });
  const body = await readBackendJson(response);

  if (!response.ok) {
    return NextResponse.json(body ?? {}, { status: response.status });
  }

  const data = (body as { data?: { reset_token?: string; expires_in?: number } } | null)?.data;
  const nextResponse = NextResponse.json(
    { data: { success: true }, meta: {} },
    { status: response.status },
  );

  if (data?.reset_token) {
    setResetTokenCookie(nextResponse, data.reset_token, data.expires_in ?? RESET_TOKEN_MAX_AGE);
  }

  return nextResponse;
}
