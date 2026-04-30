import { backendFetch, readBackendJson } from "@/lib/server/backend";
import { persistSignupTokenFromBody } from "@/lib/server/signup-session";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const response = await backendFetch("/auth/signup/resend", {
    method: "POST",
    body: await request.arrayBuffer(),
  });
  const body = await readBackendJson(response);

  if (!response.ok) {
    return NextResponse.json(body ?? { message: response.statusText }, {
      status: response.status,
    });
  }

  // Persist a refreshed signup token if the backend includes one in the resend response.
  const frontendResponse = NextResponse.json(body ?? {}, {
    status: response.status,
  });
  persistSignupTokenFromBody(frontendResponse, body);
  return frontendResponse;
}
