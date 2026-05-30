import { NextResponse } from "next/server";
import { backendFetch, readBackendJson } from "@/infrastructure/auth-transport/backend";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const invitationId = searchParams.get("invitation_id") ?? "";
  const token = searchParams.get("token") ?? "";

  const response = await backendFetch(
    `/invitations/preview?invitation_id=${encodeURIComponent(invitationId)}&token=${encodeURIComponent(token)}`,
  );
  const body = await readBackendJson(response);

  return NextResponse.json(body ?? { message: response.statusText }, {
    status: response.status,
  });
}
