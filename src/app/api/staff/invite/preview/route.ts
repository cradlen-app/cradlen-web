import { NextResponse } from "next/server";
import { backendFetch, readBackendJson } from "@/lib/server/backend";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const invitation = searchParams.get("invitation") ?? "";
  const token = searchParams.get("token") ?? "";

  const response = await backendFetch(
    `/invitations/preview?invitation=${encodeURIComponent(invitation)}&token=${encodeURIComponent(token)}`,
  );
  const body = await readBackendJson(response);

  return NextResponse.json(body ?? { message: response.statusText }, {
    status: response.status,
  });
}
