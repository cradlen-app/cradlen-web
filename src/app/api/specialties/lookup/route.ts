import { NextResponse } from "next/server";
import { backendFetch, readBackendJson } from "@/infrastructure/auth-transport/backend";

// Public proxy: the backend `GET /specialties/lookup` is `@Public()`, so this
// route forwards without any auth tokens. Needed during signup step 3 (org
// onboarding) where the user is not authenticated yet.
export async function GET(request: Request) {
  const acceptLanguage = request.headers.get("accept-language");
  const response = await backendFetch("/specialties/lookup", {
    headers: acceptLanguage ? { "Accept-Language": acceptLanguage } : {},
  });
  const body = await readBackendJson(response);

  return NextResponse.json(body ?? { message: response.statusText }, {
    status: response.status,
  });
}
