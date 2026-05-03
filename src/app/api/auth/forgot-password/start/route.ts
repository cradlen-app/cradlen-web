import { type NextRequest, NextResponse } from "next/server";
import {
  backendFetch,
  readBackendJson,
  setResetTokenCookie,
} from "@/lib/server/backend";
import { RESET_TOKEN_MAX_AGE } from "@/features/auth/lib/auth.constants";

export async function POST(request: NextRequest) {
  const response = await backendFetch("/auth/forgot-password", {
    method: "POST",
    body: await request.arrayBuffer(),
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
