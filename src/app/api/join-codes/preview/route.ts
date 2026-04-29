import { NextResponse } from "next/server";
import { backendFetch, readBackendJson } from "@/lib/server/backend";

export async function POST(request: Request) {
  const response = await backendFetch("/join-codes/preview", {
    method: "POST",
    body: await request.arrayBuffer(),
  });
  const body = await readBackendJson(response);

  return NextResponse.json(body ?? {}, { status: response.status });
}
