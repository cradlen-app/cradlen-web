import { NextResponse } from "next/server";
import { backendFetch, readBackendJson } from "@/infrastructure/auth-transport/backend";

export async function POST(request: Request) {
  const requestBody = await request.arrayBuffer();
  const response = await backendFetch("/invitations/decline", {
    method: "POST",
    body: requestBody,
  });
  const body = await readBackendJson(response);

  return NextResponse.json(body ?? { message: response.statusText }, {
    status: response.status,
  });
}
