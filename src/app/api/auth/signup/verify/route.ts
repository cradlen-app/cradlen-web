import { backendFetch, readBackendJson } from "@/lib/server/backend";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const response = await backendFetch("/auth/signup/verify", {
    method: "POST",
    body: await request.arrayBuffer(),
  });
  const body = await readBackendJson(response);

  return NextResponse.json(body ?? {}, { status: response.status });
}
