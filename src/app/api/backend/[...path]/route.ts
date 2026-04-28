import { type NextRequest } from "next/server";
import { proxyAuthenticatedRequest } from "@/lib/server/backend";

type Context = {
  params: Promise<{ path?: string[] }>;
};

async function handler(request: NextRequest, context: Context) {
  const { path = [] } = await context.params;
  const search = request.nextUrl.search;
  return proxyAuthenticatedRequest(request, `/${path.join("/")}${search}`);
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
