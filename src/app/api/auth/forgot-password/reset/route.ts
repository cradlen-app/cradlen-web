import { type NextRequest, NextResponse } from "next/server";
import {
  backendFetch,
  clearResetTokenCookie,
  getResetTokenFromRequest,
  readBackendJson,
} from "@/lib/server/backend";

export async function POST(request: NextRequest) {
  const resetToken = getResetTokenFromRequest(request);
  if (!resetToken) {
    return NextResponse.json(
      { error: { code: "SESSION_EXPIRED", message: "Reset session expired or not found", statusCode: 401 } },
      { status: 401 },
    );
  }

  const clientBody = await request.json() as { password?: string; confirm_password?: string };
  const response = await backendFetch("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({
      reset_token: resetToken,
      password: clientBody.password,
      confirm_password: clientBody.confirm_password,
    }),
  });
  const body = await readBackendJson(response);

  if (!response.ok) {
    return NextResponse.json(body ?? {}, { status: response.status });
  }

  const nextResponse =
    response.status === 204
      ? new NextResponse(null, { status: 204 })
      : NextResponse.json(body ?? {}, { status: response.status });

  clearResetTokenCookie(nextResponse as NextResponse);
  return nextResponse;
}
