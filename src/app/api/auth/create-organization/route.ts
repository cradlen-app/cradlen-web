import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  AUTH_SELECTION_TOKEN_COOKIE,
  AUTH_TOKEN_COOKIE,
} from "@/features/auth/lib/auth.constants";
import { backendFetch, readBackendJson } from "@/lib/server/backend";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const bearer =
    cookieStore.get(AUTH_TOKEN_COOKIE)?.value ??
    cookieStore.get(AUTH_SELECTION_TOKEN_COOKIE)?.value;

  if (!bearer) {
    return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  }

  const body = await request.arrayBuffer();
  const response = await backendFetch("/organizations", {
    method: "POST",
    headers: { Authorization: `Bearer ${bearer}` },
    body,
  });

  const responseBody = await readBackendJson(response);
  return NextResponse.json(responseBody ?? { message: response.statusText }, {
    status: response.status,
  });
}
